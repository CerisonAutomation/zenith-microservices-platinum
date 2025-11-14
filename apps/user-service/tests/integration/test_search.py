"""
Search Service Tests
Tests for Elasticsearch integration, profile search, and content search
"""

import pytest
from unittest.mock import patch, Mock, AsyncMock
from core.elasticsearch import SearchService


@pytest.mark.integration
@pytest.mark.search
@pytest.mark.elasticsearch
class TestSearchService:
    """Test Elasticsearch search service"""

    @pytest.fixture
    def search_service(self, mock_elasticsearch):
        """Create search service with mocked Elasticsearch"""
        with patch("core.elasticsearch.get_elasticsearch_client") as mock_get_client:
            mock_get_client.return_value = mock_elasticsearch
            service = SearchService()
            return service

    @pytest.mark.asyncio
    async def test_create_indexes(self, search_service, mock_elasticsearch):
        """Test creating Elasticsearch indexes"""
        await search_service.create_indexes()

        # Verify indices.create was called for each mapping
        assert mock_elasticsearch.indices.create.call_count >= 1

    @pytest.mark.asyncio
    async def test_index_document_success(self, search_service, mock_elasticsearch):
        """Test indexing a document"""
        doc_id = "user_123"
        document = {
            "id": "user_123",
            "full_name": "John Doe",
            "age": 30,
            "gender": "male",
            "bio": "Test bio",
            "is_verified": True,
            "is_online": True
        }

        result = await search_service.index_document("profiles", doc_id, document)

        assert result is True
        mock_elasticsearch.index.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_profiles_with_query(self, search_service, mock_elasticsearch):
        """Test searching profiles with text query"""
        result = await search_service.search(
            query="John",
            doc_type="profiles",
            page=1,
            limit=20
        )

        assert "results" in result
        assert "total" in result
        assert len(result["results"]) > 0
        assert result["results"][0]["full_name"] == "John Doe"
        mock_elasticsearch.search.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_profiles_with_age_filter(self, search_service, mock_elasticsearch):
        """Test searching profiles with age filter"""
        filters = {
            "age_min": 25,
            "age_max": 35
        }

        result = await search_service.search(
            query=None,
            doc_type="profiles",
            filters=filters,
            page=1,
            limit=20
        )

        assert "results" in result
        assert result["total"] >= 0

    @pytest.mark.asyncio
    async def test_search_profiles_with_gender_filter(self, search_service, mock_elasticsearch):
        """Test searching profiles with gender filter"""
        filters = {
            "gender": ["female"]
        }

        result = await search_service.search(
            query=None,
            doc_type="profiles",
            filters=filters,
            page=1,
            limit=20
        )

        assert "results" in result

    @pytest.mark.asyncio
    async def test_search_profiles_with_location_filter(self, search_service, mock_elasticsearch):
        """Test searching profiles with geolocation filter"""
        filters = {
            "location": {
                "latitude": 40.7128,
                "longitude": -74.0060
            },
            "distance": 50
        }

        result = await search_service.search(
            query=None,
            doc_type="profiles",
            filters=filters,
            page=1,
            limit=20
        )

        assert "results" in result

    @pytest.mark.asyncio
    async def test_search_verified_only(self, search_service, mock_elasticsearch):
        """Test searching for verified profiles only"""
        filters = {
            "verified_only": True
        }

        result = await search_service.search(
            query=None,
            doc_type="profiles",
            filters=filters,
            page=1,
            limit=20
        )

        assert "results" in result
        # All results should be verified
        for profile in result["results"]:
            assert profile.get("is_verified") is True

    @pytest.mark.asyncio
    async def test_search_online_only(self, search_service, mock_elasticsearch):
        """Test searching for online users only"""
        filters = {
            "online_only": True
        }

        result = await search_service.search(
            query=None,
            doc_type="profiles",
            filters=filters,
            page=1,
            limit=20
        )

        assert "results" in result

    @pytest.mark.asyncio
    async def test_search_with_pagination(self, search_service, mock_elasticsearch):
        """Test search pagination"""
        # Page 1
        result_page1 = await search_service.search(
            query="test",
            doc_type="profiles",
            page=1,
            limit=10
        )

        assert result_page1["page"] == 1
        assert result_page1["limit"] == 10

        # Page 2
        result_page2 = await search_service.search(
            query="test",
            doc_type="profiles",
            page=2,
            limit=10
        )

        assert result_page2["page"] == 2

    @pytest.mark.asyncio
    async def test_search_sorting(self, search_service, mock_elasticsearch):
        """Test search result sorting"""
        result = await search_service.search(
            query="test",
            doc_type="profiles",
            page=1,
            limit=20,
            sort_by="age",
            sort_order="asc"
        )

        assert "results" in result

    @pytest.mark.asyncio
    async def test_delete_document(self, search_service, mock_elasticsearch):
        """Test deleting a document"""
        result = await search_service.delete_document("profiles", "user_123")

        assert result is True
        mock_elasticsearch.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_bulk_index(self, search_service, mock_elasticsearch):
        """Test bulk indexing documents"""
        documents = [
            {
                "id": "user_1",
                "full_name": "User One",
                "age": 25
            },
            {
                "id": "user_2",
                "full_name": "User Two",
                "age": 30
            }
        ]

        result = await search_service.bulk_index("profiles", documents)

        assert "indexed" in result
        assert result["indexed"] == 2
        mock_elasticsearch.bulk.assert_called_once()

    @pytest.mark.asyncio
    async def test_suggest_autocomplete(self, search_service, mock_elasticsearch):
        """Test autocomplete suggestions"""
        # Mock suggest response
        mock_elasticsearch.search.return_value = {
            "suggest": {
                "suggestions": [
                    {"text": "John"},
                    {"text": "Jane"}
                ]
            }
        }

        suggestions = await search_service.suggest(
            query="Jo",
            doc_type="profiles",
            limit=10
        )

        assert isinstance(suggestions, list)


@pytest.mark.integration
@pytest.mark.search
class TestSearchRouter:
    """Test search API endpoints"""

    def test_search_profiles_endpoint(self, client, mock_elasticsearch):
        """Test /api/v1/search/profiles endpoint"""
        response = client.get(
            "/api/v1/search/profiles",
            params={
                "query": "John",
                "page": 1,
                "limit": 20
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data
        assert "page" in data

    def test_search_profiles_with_filters(self, client, mock_elasticsearch):
        """Test profile search with multiple filters"""
        response = client.get(
            "/api/v1/search/profiles",
            params={
                "query": "test",
                "age_min": 25,
                "age_max": 35,
                "gender": ["female"],
                "verified_only": True,
                "page": 1,
                "limit": 20
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    def test_search_profiles_geolocation(self, client, mock_elasticsearch):
        """Test profile search with geolocation"""
        response = client.get(
            "/api/v1/search/profiles",
            params={
                "latitude": 40.7128,
                "longitude": -74.0060,
                "distance": 50,
                "page": 1,
                "limit": 20
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    def test_search_profiles_invalid_params(self, client, mock_elasticsearch):
        """Test profile search with invalid parameters"""
        response = client.get(
            "/api/v1/search/profiles",
            params={
                "age_min": 100,
                "age_max": 18,  # Invalid: max < min
                "page": 1,
                "limit": 20
            }
        )

        # Should handle gracefully or return validation error
        assert response.status_code in [200, 400, 422]

    def test_search_content_endpoint(self, client, mock_elasticsearch):
        """Test /api/v1/search/content endpoint"""
        response = client.get(
            "/api/v1/search/content",
            params={
                "query": "test",
                "content_type": "blog",
                "page": 1,
                "limit": 20
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data

    def test_search_suggestions_endpoint(self, client, mock_elasticsearch):
        """Test /api/v1/search/suggestions endpoint"""
        # Mock suggest response
        mock_elasticsearch.search.return_value = {
            "suggest": {
                "suggestions": [
                    {"text": "John"},
                    {"text": "Jane"}
                ]
            }
        }

        response = client.get(
            "/api/v1/search/suggestions",
            params={
                "q": "Jo",
                "doc_type": "profiles",
                "limit": 10
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data

    def test_search_empty_query(self, client, mock_elasticsearch):
        """Test search with empty query (should return all)"""
        response = client.get(
            "/api/v1/search/profiles",
            params={
                "page": 1,
                "limit": 20
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    def test_search_pagination_limits(self, client, mock_elasticsearch):
        """Test search pagination limits"""
        # Test max limit
        response = client.get(
            "/api/v1/search/profiles",
            params={
                "page": 1,
                "limit": 200  # Above max
            }
        )

        # Should enforce max limit
        assert response.status_code in [200, 422]

    def test_search_with_interests(self, client, mock_elasticsearch):
        """Test search with interest matching"""
        response = client.get(
            "/api/v1/search/profiles",
            params={
                "interests": ["music", "travel"],
                "page": 1,
                "limit": 20
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data


@pytest.mark.integration
@pytest.mark.search
class TestSearchPerformance:
    """Test search performance and edge cases"""

    @pytest.mark.asyncio
    async def test_search_with_many_filters(self, search_service, mock_elasticsearch):
        """Test search with many combined filters"""
        filters = {
            "age_min": 25,
            "age_max": 35,
            "gender": ["female"],
            "verified_only": True,
            "online_only": True,
            "interests": ["music", "travel", "sports"],
            "location": {
                "latitude": 40.7128,
                "longitude": -74.0060
            },
            "distance": 50
        }

        result = await search_service.search(
            query="test",
            doc_type="profiles",
            filters=filters,
            page=1,
            limit=20
        )

        assert "results" in result
        assert "metadata" in result

    @pytest.mark.asyncio
    async def test_search_large_result_set(self, search_service, mock_elasticsearch):
        """Test search handling large result sets"""
        # Mock large result set
        mock_elasticsearch.search.return_value = {
            "hits": {
                "total": {"value": 10000},
                "hits": [
                    {
                        "_id": f"user_{i}",
                        "_score": 1.0,
                        "_source": {"id": f"user_{i}", "full_name": f"User {i}"}
                    }
                    for i in range(20)
                ]
            },
            "took": 50,
            "timed_out": False
        }

        result = await search_service.search(
            query="test",
            doc_type="profiles",
            page=1,
            limit=20
        )

        assert result["total"] == 10000
        assert len(result["results"]) == 20

    @pytest.mark.asyncio
    async def test_search_empty_results(self, search_service, mock_elasticsearch):
        """Test search with no matching results"""
        # Mock empty result
        mock_elasticsearch.search.return_value = {
            "hits": {
                "total": {"value": 0},
                "hits": []
            },
            "took": 5,
            "timed_out": False
        }

        result = await search_service.search(
            query="nonexistent",
            doc_type="profiles",
            page=1,
            limit=20
        )

        assert result["total"] == 0
        assert len(result["results"]) == 0

    @pytest.mark.asyncio
    async def test_search_special_characters(self, search_service, mock_elasticsearch):
        """Test search with special characters"""
        special_queries = [
            "test@example.com",
            "user#123",
            "name with spaces",
            "unicode: 你好"
        ]

        for query in special_queries:
            result = await search_service.search(
                query=query,
                doc_type="profiles",
                page=1,
                limit=20
            )

            assert "results" in result
