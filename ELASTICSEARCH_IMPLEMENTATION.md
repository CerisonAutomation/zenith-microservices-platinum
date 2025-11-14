# Elasticsearch Search Implementation

## Overview

This document details the comprehensive Elasticsearch-based search implementation for the Zenith microservices platform. The implementation replaces the previous mock search with a production-ready, full-text search system that supports users, profiles, and content discovery.

## Changes Summary

### 1. Configuration Updates
**File**: `apps/user-service/core/config.py`

Added Elasticsearch configuration settings:
- `elasticsearch_hosts`: List of Elasticsearch hosts (default: `http://localhost:9200`)
- `elasticsearch_user`: Optional authentication username
- `elasticsearch_password`: Optional authentication password
- `elasticsearch_timeout`: Request timeout in seconds (default: 30)
- `elasticsearch_max_retries`: Maximum retry attempts (default: 3)
- `elasticsearch_index_prefix`: Index name prefix (default: `zenith`)

All settings can be configured via environment variables with corresponding aliases.

### 2. Elasticsearch Service Module
**File**: `apps/user-service/core/elasticsearch.py` (NEW)

Created a comprehensive Elasticsearch integration module with:

#### Core Components

**Global Client Management**
- `init_elasticsearch()`: Initialize Elasticsearch client with configured settings
- `get_elasticsearch_client()`: Get or create singleton client instance
- `close_elasticsearch()`: Gracefully close client connection

**SearchService Class**
Enterprise-grade search service with the following features:

#### Supported Document Types

1. **Profiles Index**
   - Full-text search on name, bio, interests
   - Age range filtering
   - Gender preferences
   - Geospatial (geo-point) location-based search
   - Verification and online status filtering
   - Last seen timestamp tracking

2. **Content Index**
   - Full-text search on title and content
   - Content type filtering (blog, forum, gallery)
   - Publication status filtering
   - View count tracking
   - Tag-based filtering

#### Key Methods

- `create_indexes()`: Create or update Elasticsearch indexes with proper mappings
- `search()`: Advanced search with filters, pagination, and sorting
- `index_document()`: Index a single document
- `bulk_index()`: Bulk index multiple documents for performance
- `delete_document()`: Remove a document from index
- `suggest()`: Get autocomplete suggestions with fuzzy matching

#### Query Building

The `_build_query()` method constructs sophisticated Elasticsearch Bool queries supporting:
- Full-text search across multiple fields with field-specific weights
- Age range queries
- Gender/interests term matching
- Geographic distance queries
- Status filters (verified, online, published)
- Fuzzy matching for typos

#### Result Formatting

The `_format_search_results()` method transforms Elasticsearch responses into standardized API responses with:
- Pagination metadata
- Relevance scores
- Execution timing information
- Error handling for missing indexes

### 3. Search Router Enhancements
**File**: `apps/user-service/services/search/router.py`

Completely rewritten with real Elasticsearch implementation:

#### New Endpoints

**GET /api/v1/search/profiles**
Advanced profile discovery endpoint with:
- Full-text search query support
- Age range filtering (18-100)
- Gender preference filtering
- Geospatial distance search
- Interest-based matching
- Verification status filtering
- Online status filtering
- Flexible sorting (_score, age, last_seen)
- Pagination with configurable limits (1-100 per page)
- Relevance scoring

Example request:
```
GET /api/v1/search/profiles?query=hiking&age_min=25&age_max=35&verified_only=true&latitude=40.7128&longitude=-74.0060&distance=50&sort_by=_score&page=1&limit=20
```

**GET /api/v1/search/content**
Content discovery endpoint for blog posts, forum threads, and gallery items:
- Full-text search across titles and content
- Content type filtering (blog, forum, gallery)
- Publication status filtering
- Sorting by relevance, creation date, or view count
- Pagination support

Example request:
```
GET /api/v1/search/content?query=travel+tips&content_type=blog&is_published=true&sort_by=created_at&page=1&limit=20
```

**GET /api/v1/search/suggestions**
Autocomplete and search suggestions endpoint:
- Document type selection (profiles or content)
- Fuzzy matching for typo tolerance
- Configurable result limit
- Graceful error handling

Example request:
```
GET /api/v1/search/suggestions?q=hik&doc_type=profiles&limit=10
```

#### Enhanced Response Models

**EnhancedSearchResult**
Extended result model with:
- All basic profile fields
- Relevance score (Elasticsearch BM25 score)
- Interests list for profile results
- Tag list for content results

**EnhancedSearchResponse**
Standardized response with:
- Result list
- Total count
- Pagination metadata (page, limit, pages)
- Performance metadata (query execution time, timeout status)

#### Error Handling

Comprehensive error handling for:
- Connection failures
- Index not found errors
- Malformed queries
- Timeout scenarios
- Graceful fallbacks

All errors are logged with structured logging including request context and are returned as HTTP 500 with descriptive messages.

### 4. Application Lifecycle Integration
**File**: `apps/user-service/main.py`

Updated the application lifespan manager to:
- Initialize Elasticsearch on startup
- Create indexes automatically
- Log initialization status
- Handle initialization failures gracefully
- Close Elasticsearch connection on shutdown

## Technical Specifications

### Dependencies

Elasticsearch client (already in requirements.txt):
```
elasticsearch==8.10.0
```

### Index Mappings

#### Profiles Index (`zenith-profiles`)
```json
{
  "properties": {
    "id": {"type": "keyword"},
    "full_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
    "bio": {"type": "text"},
    "age": {"type": "integer"},
    "gender": {"type": "keyword"},
    "interests": {"type": "keyword"},
    "location": {"type": "geo_point"},
    "is_verified": {"type": "boolean"},
    "is_online": {"type": "boolean"},
    "is_active": {"type": "boolean"},
    "last_seen": {"type": "date"},
    "created_at": {"type": "date"}
  }
}
```

#### Content Index (`zenith-content`)
```json
{
  "properties": {
    "id": {"type": "keyword"},
    "title": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
    "content": {"type": "text"},
    "type": {"type": "keyword"},
    "tags": {"type": "keyword"},
    "is_published": {"type": "boolean"},
    "created_at": {"type": "date"},
    "view_count": {"type": "integer"}
  }
}
```

### Query Strategy

**Multi-Match Query**
- Supports full-text search across multiple fields
- Field weights: `full_name^3` (highest), `title^2`, `bio^2`, `interests`, `content`
- Fuzziness: AUTO (adaptive based on term length)
- Operator: OR (any match is relevant)

**Bool Query Composition**
- `must` clauses: Text search (AND logic)
- `filter` clauses: Status/range filters (no scoring)
- Combined for optimal performance and relevance

## Configuration Examples

### Environment Variables

```bash
# Elasticsearch Configuration
ELASTICSEARCH_HOSTS=http://localhost:9200,http://elasticsearch-2:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=your_password
ELASTICSEARCH_TIMEOUT=30
ELASTICSEARCH_MAX_RETRIES=3
ELASTICSEARCH_INDEX_PREFIX=zenith
```

### Docker Compose Setup

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  ports:
    - "9200:9200"
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data
```

## API Usage Examples

### Profile Search with All Filters
```bash
curl -X GET "http://localhost:8000/api/v1/search/profiles?query=hiking&age_min=25&age_max=35&gender=female&verified_only=true&latitude=40.7128&longitude=-74.0060&distance=50&sort_by=_score&page=1&limit=20"
```

### Content Search
```bash
curl -X GET "http://localhost:8000/api/v1/search/content?query=travel&content_type=blog&sort_by=created_at&page=1&limit=10"
```

### Get Suggestions
```bash
curl -X GET "http://localhost:8000/api/v1/search/suggestions?q=hik&doc_type=profiles&limit=10"
```

## Performance Considerations

### Indexing
- Bulk indexing supported for batch operations
- Automatic index creation on startup
- Index prefix allows multi-environment setup

### Querying
- Connection pooling with configurable pool size
- Request timeout handling
- Automatic retry on timeout
- Connection validation before use

### Scaling
- Multiple Elasticsearch hosts supported
- Load balancing across nodes
- Connection recycling after 1 hour
- Keep-alive intervals configured

## Monitoring and Logging

All operations are logged using structlog with:
- Request context (query, filters, page)
- Performance metrics (execution time, result count)
- Error context (exception info, error details)
- Component initialization status

Example log output:
```
2024-11-14T10:30:45Z logger=elasticsearch event="Profile search executed" query="hiking" results_count=15 total=42 page=1 filters=['age_min', 'verified_only']
```

## Future Enhancements

1. **Advanced Features**
   - Synonym handling for interest matching
   - Custom scoring with user preferences
   - Real-time indexing of new content
   - Search analytics and trending queries

2. **Performance**
   - Query result caching
   - Asynchronous bulk indexing
   - Index sharding for large datasets
   - Aggregations for faceted search

3. **Integration**
   - Webhook triggers for content updates
   - Search event tracking
   - A/B testing for relevance algorithms
   - Integration with recommendation engine

## Testing

To test the search endpoints:

1. **Ensure Elasticsearch is running**
   ```bash
   curl http://localhost:9200/_cluster/health
   ```

2. **Index sample data**
   ```python
   from core.elasticsearch import SearchService

   service = SearchService()
   await service.bulk_index("profiles", [
       {
           "id": "user-1",
           "full_name": "Alice Johnson",
           "age": 28,
           "gender": "female",
           "bio": "Love hiking and coffee"
       }
   ])
   ```

3. **Query the API**
   ```bash
   curl http://localhost:8000/api/v1/search/profiles?query=hiking
   ```

## Troubleshooting

### Connection Issues
- Verify Elasticsearch is running: `curl http://localhost:9200`
- Check credentials if using authentication
- Verify hosts in configuration
- Review connection timeout settings

### Index Not Found
- Indexes are created automatically on startup
- Check Elasticsearch logs for creation errors
- Manually create indexes if needed
- Verify index prefix matches configuration

### No Results
- Ensure data is indexed (use bulk_index or index_document)
- Check query syntax and field names
- Verify filters match indexed data
- Try broader search queries

### Performance Issues
- Monitor Elasticsearch cluster health
- Check query complexity (avoid too many filters)
- Consider enabling query result caching
- Review index size and shard allocation
