"""
Elasticsearch Integration and Search Service
Provides full-text search across users, profiles, and content
"""

import logging
from typing import Optional, List, Dict, Any
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import (
    ConnectionError, NotFoundError, BadRequestError, RequestError
)
import structlog

from .config import settings

logger = structlog.get_logger(__name__)

# Global Elasticsearch client instance
_es_client: Optional[Elasticsearch] = None


def get_elasticsearch_client() -> Elasticsearch:
    """Get or create Elasticsearch client instance"""
    global _es_client

    if _es_client is None:
        _es_client = init_elasticsearch()

    return _es_client


def init_elasticsearch() -> Elasticsearch:
    """Initialize Elasticsearch client with configured settings"""
    try:
        # Configure authentication if credentials provided
        auth = None
        if settings.elasticsearch_user and settings.elasticsearch_password:
            auth = (settings.elasticsearch_user, settings.elasticsearch_password)

        client = Elasticsearch(
            hosts=settings.elasticsearch_hosts,
            basic_auth=auth if auth else None,
            request_timeout=settings.elasticsearch_timeout,
            max_retries=settings.elasticsearch_max_retries,
            retry_on_timeout=True,
            verify_certs=False,  # Set to True in production with proper certs
            ssl_show_warn=False
        )

        # Test connection
        info = client.info()
        logger.info(
            "Elasticsearch connected successfully",
            version=info.get('version', {}).get('number')
        )

        return client
    except ConnectionError as e:
        logger.error(
            "Failed to connect to Elasticsearch",
            error=str(e),
            hosts=settings.elasticsearch_hosts
        )
        raise


async def close_elasticsearch() -> None:
    """Close Elasticsearch client connection"""
    global _es_client

    if _es_client is not None:
        try:
            _es_client.close()
            logger.info("Elasticsearch connection closed")
        except Exception as e:
            logger.error("Error closing Elasticsearch connection", error=str(e))
        finally:
            _es_client = None


class SearchService:
    """Enterprise-grade search service using Elasticsearch"""

    # Index mappings for different document types
    MAPPINGS = {
        "profiles": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "full_name": {
                    "type": "text",
                    "fields": {"keyword": {"type": "keyword"}}
                },
                "bio": {"type": "text"},
                "age": {"type": "integer"},
                "gender": {"type": "keyword"},
                "interests": {
                    "type": "keyword"
                },
                "location": {
                    "type": "geo_point"
                },
                "is_verified": {"type": "boolean"},
                "is_online": {"type": "boolean"},
                "is_active": {"type": "boolean"},
                "avatar_url": {"type": "keyword"},
                "last_seen": {"type": "date"},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"},
                "compatibility_score": {"type": "float"}
            }
        },
        "content": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "title": {
                    "type": "text",
                    "fields": {"keyword": {"type": "keyword"}}
                },
                "content": {"type": "text"},
                "type": {"type": "keyword"},  # blog, forum, gallery
                "tags": {"type": "keyword"},
                "is_published": {"type": "boolean"},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"},
                "view_count": {"type": "integer"}
            }
        }
    }

    def __init__(self):
        self.client = get_elasticsearch_client()
        self.index_prefix = settings.elasticsearch_index_prefix

    def _get_index_name(self, doc_type: str) -> str:
        """Get full index name with prefix"""
        return f"{self.index_prefix}-{doc_type}"

    async def create_indexes(self) -> None:
        """Create or update Elasticsearch indexes"""
        try:
            for doc_type, mapping in self.MAPPINGS.items():
                index_name = self._get_index_name(doc_type)

                try:
                    # Check if index exists
                    if self.client.indices.exists(index=index_name):
                        logger.info(f"Index {index_name} already exists")
                    else:
                        # Create new index
                        self.client.indices.create(
                            index=index_name,
                            body={"mappings": mapping}
                        )
                        logger.info(f"Created Elasticsearch index: {index_name}")
                except BadRequestError:
                    logger.warning(f"Index {index_name} creation skipped")
        except Exception as e:
            logger.error("Failed to create Elasticsearch indexes", error=str(e))
            raise

    async def index_document(
        self,
        doc_type: str,
        doc_id: str,
        document: Dict[str, Any]
    ) -> bool:
        """Index a single document"""
        try:
            index_name = self._get_index_name(doc_type)
            self.client.index(index=index_name, id=doc_id, body=document)
            logger.info(f"Indexed document {doc_id} in {index_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to index document {doc_id}", error=str(e))
            return False

    async def search(
        self,
        query: Optional[str] = None,
        doc_type: str = "profiles",
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        limit: int = 20,
        sort_by: str = "_score",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """
        Perform advanced search with filters, pagination, and sorting

        Args:
            query: Full-text search query
            doc_type: Document type to search (profiles, content)
            filters: Additional filter conditions
            page: Page number (1-indexed)
            limit: Results per page
            sort_by: Field to sort by
            sort_order: Sort order (asc or desc)

        Returns:
            Search results with metadata
        """
        try:
            index_name = self._get_index_name(doc_type)

            # Build query
            es_query = self._build_query(query, filters)

            # Calculate offset
            offset = (page - 1) * limit

            # Execute search
            search_body = {
                "query": es_query,
                "from": offset,
                "size": limit,
                "sort": [
                    {sort_by: {"order": sort_order}}
                ] if sort_by != "_score" else []
            }

            response = self.client.search(
                index=index_name,
                body=search_body
            )

            # Format results
            return self._format_search_results(response, page, limit)

        except NotFoundError:
            logger.warning(f"Index {index_name} not found")
            return {
                "results": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "pages": 0,
                "metadata": {"error": f"Index {index_name} not found"}
            }
        except Exception as e:
            logger.error("Search failed", error=str(e), query=query)
            raise

    def _build_query(
        self,
        query: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Build Elasticsearch query from parameters"""
        must_clauses = []
        filter_clauses = []

        # Full-text search
        if query:
            must_clauses.append({
                "multi_match": {
                    "query": query,
                    "fields": ["full_name^3", "bio^2", "content", "title^2", "interests"],
                    "fuzziness": "AUTO",
                    "operator": "or"
                }
            })

        # Apply filters
        if filters:
            # Age range filter
            if "age_min" in filters or "age_max" in filters:
                age_filter = {}
                if "age_min" in filters:
                    age_filter["gte"] = filters["age_min"]
                if "age_max" in filters:
                    age_filter["lte"] = filters["age_max"]
                filter_clauses.append({"range": {"age": age_filter}})

            # Gender filter
            if "gender" in filters:
                genders = filters["gender"] if isinstance(filters["gender"], list) else [filters["gender"]]
                filter_clauses.append({"terms": {"gender": genders}})

            # Verification status
            if "verified_only" in filters and filters["verified_only"]:
                filter_clauses.append({"term": {"is_verified": True}})

            # Online status
            if "online_only" in filters and filters["online_only"]:
                filter_clauses.append({"term": {"is_online": True}})

            # Active status
            if "is_active" in filters:
                filter_clauses.append({"term": {"is_active": filters["is_active"]}})

            # Interests filter
            if "interests" in filters:
                interests = filters["interests"] if isinstance(filters["interests"], list) else [filters["interests"]]
                filter_clauses.append({
                    "terms": {"interests": interests}
                })

            # Location-based search (geo distance)
            if "location" in filters and "distance" in filters:
                lat = filters["location"].get("latitude")
                lon = filters["location"].get("longitude")
                distance = filters["distance"]

                if lat is not None and lon is not None:
                    filter_clauses.append({
                        "geo_distance": {
                            "distance": f"{distance}km",
                            "location": {
                                "lat": lat,
                                "lon": lon
                            }
                        }
                    })

            # Content type filter
            if "content_type" in filters:
                filter_clauses.append({"term": {"type": filters["content_type"]}})

            # Published status
            if "is_published" in filters:
                filter_clauses.append({"term": {"is_published": filters["is_published"]}})

        # Build final query
        if must_clauses or filter_clauses:
            bool_query = {}
            if must_clauses:
                bool_query["must"] = must_clauses if len(must_clauses) > 1 else must_clauses[0]
            if filter_clauses:
                bool_query["filter"] = filter_clauses if len(filter_clauses) > 1 else filter_clauses[0]
            return {"bool": bool_query}

        # Default match all if no query
        return {"match_all": {}}

    def _format_search_results(
        self,
        response: Dict[str, Any],
        page: int,
        limit: int
    ) -> Dict[str, Any]:
        """Format Elasticsearch response to API response"""
        hits = response.get("hits", {})
        total = hits.get("total", {})

        # Handle different Elasticsearch versions
        if isinstance(total, dict):
            total_count = total.get("value", 0)
        else:
            total_count = total

        results = []
        for hit in hits.get("hits", []):
            result = hit["_source"]
            result["_score"] = hit.get("_score", 0)
            result["_id"] = hit.get("_id")
            results.append(result)

        total_pages = (total_count + limit - 1) // limit if limit > 0 else 0

        return {
            "results": results,
            "total": total_count,
            "page": page,
            "limit": limit,
            "pages": total_pages,
            "metadata": {
                "took": response.get("took", 0),
                "timed_out": response.get("timed_out", False)
            }
        }

    async def delete_document(self, doc_type: str, doc_id: str) -> bool:
        """Delete a document from Elasticsearch"""
        try:
            index_name = self._get_index_name(doc_type)
            self.client.delete(index=index_name, id=doc_id)
            logger.info(f"Deleted document {doc_id} from {index_name}")
            return True
        except NotFoundError:
            logger.warning(f"Document {doc_id} not found")
            return False
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}", error=str(e))
            raise

    async def bulk_index(
        self,
        doc_type: str,
        documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Bulk index multiple documents"""
        try:
            index_name = self._get_index_name(doc_type)

            bulk_body = []
            for doc in documents:
                doc_id = doc.get("id", doc.get("_id"))

                # Index action
                bulk_body.append({
                    "index": {
                        "_index": index_name,
                        "_id": doc_id
                    }
                })
                # Document
                bulk_body.append(doc)

            response = self.client.bulk(body=bulk_body)

            logger.info(
                "Bulk indexing completed",
                indexed=len(documents),
                errors=response.get("errors", False)
            )

            return {
                "indexed": len(documents),
                "took": response.get("took", 0),
                "errors": response.get("errors", False)
            }
        except Exception as e:
            logger.error("Bulk indexing failed", error=str(e))
            raise

    async def suggest(
        self,
        query: str,
        doc_type: str = "profiles",
        limit: int = 10
    ) -> List[str]:
        """Get search suggestions/autocomplete"""
        try:
            index_name = self._get_index_name(doc_type)

            # Map document type to appropriate fields
            suggestion_fields = {
                "profiles": ["full_name.keyword"],
                "content": ["title.keyword"]
            }

            fields = suggestion_fields.get(doc_type, ["full_name.keyword"])

            suggest_body = {
                "suggestions": {
                    "text": query,
                    "completion": {
                        "field": fields[0] if fields else "full_name.keyword",
                        "size": limit,
                        "skip_duplicates": True,
                        "fuzzy": {
                            "fuzziness": "AUTO"
                        }
                    }
                }
            }

            response = self.client.search(index=index_name, body=suggest_body)

            suggestions = []
            if "suggest" in response:
                for suggestion in response["suggest"]["suggestions"]:
                    suggestions.append(suggestion.get("text", ""))

            return suggestions[:limit]
        except Exception as e:
            logger.error("Failed to get suggestions", error=str(e))
            return []
