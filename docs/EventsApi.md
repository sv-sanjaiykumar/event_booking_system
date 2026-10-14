# event_sdk.EventsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**cancel_event_events_event_id_delete**](EventsApi.md#cancel_event_events_event_id_delete) | **DELETE** /events/{event_id} | Cancel Event
[**create_event_events_post**](EventsApi.md#create_event_events_post) | **POST** /events/ | Create Event
[**get_event_events_event_id_get**](EventsApi.md#get_event_events_event_id_get) | **GET** /events/{event_id} | Get Event
[**list_creator_events_creator_events_get**](EventsApi.md#list_creator_events_creator_events_get) | **GET** /creator/events | List Creator Events
[**list_event_bookings_creator_events_event_id_bookings_get**](EventsApi.md#list_event_bookings_creator_events_event_id_bookings_get) | **GET** /creator/events/{event_id}/bookings | List Event Bookings
[**list_events_events_get**](EventsApi.md#list_events_events_get) | **GET** /events/ | List Events
[**update_event_events_event_id_patch**](EventsApi.md#update_event_events_event_id_patch) | **PATCH** /events/{event_id} | Update Event


# **cancel_event_events_event_id_delete**
> cancel_event_events_event_id_delete(event_id)

Cancel Event

### Example

* Bearer Authentication (HTTPBearer):

```python
import event_sdk
from event_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = event_sdk.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: HTTPBearer
configuration = event_sdk.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with event_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = event_sdk.EventsApi(api_client)
    event_id = 56 # int | 

    try:
        # Cancel Event
        api_instance.cancel_event_events_event_id_delete(event_id)
    except Exception as e:
        print("Exception when calling EventsApi->cancel_event_events_event_id_delete: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **event_id** | **int**|  | 

### Return type

void (empty response body)

### Authorization

[HTTPBearer](../README.md#HTTPBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**204** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **create_event_events_post**
> EventResponse create_event_events_post(event_create)

Create Event

### Example

* Bearer Authentication (HTTPBearer):

```python
import event_sdk
from event_sdk.models.event_create import EventCreate
from event_sdk.models.event_response import EventResponse
from event_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = event_sdk.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: HTTPBearer
configuration = event_sdk.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with event_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = event_sdk.EventsApi(api_client)
    event_create = event_sdk.EventCreate() # EventCreate | 

    try:
        # Create Event
        api_response = api_instance.create_event_events_post(event_create)
        print("The response of EventsApi->create_event_events_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling EventsApi->create_event_events_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **event_create** | [**EventCreate**](EventCreate.md)|  | 

### Return type

[**EventResponse**](EventResponse.md)

### Authorization

[HTTPBearer](../README.md#HTTPBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_event_events_event_id_get**
> EventResponse get_event_events_event_id_get(event_id)

Get Event

### Example


```python
import event_sdk
from event_sdk.models.event_response import EventResponse
from event_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = event_sdk.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with event_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = event_sdk.EventsApi(api_client)
    event_id = 56 # int | 

    try:
        # Get Event
        api_response = api_instance.get_event_events_event_id_get(event_id)
        print("The response of EventsApi->get_event_events_event_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling EventsApi->get_event_events_event_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **event_id** | **int**|  | 

### Return type

[**EventResponse**](EventResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_creator_events_creator_events_get**
> List[EventResponse] list_creator_events_creator_events_get(page=page, page_size=page_size)

List Creator Events

### Example

* Bearer Authentication (HTTPBearer):

```python
import event_sdk
from event_sdk.models.event_response import EventResponse
from event_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = event_sdk.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: HTTPBearer
configuration = event_sdk.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with event_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = event_sdk.EventsApi(api_client)
    page = 1 # int |  (optional) (default to 1)
    page_size = 20 # int |  (optional) (default to 20)

    try:
        # List Creator Events
        api_response = api_instance.list_creator_events_creator_events_get(page=page, page_size=page_size)
        print("The response of EventsApi->list_creator_events_creator_events_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling EventsApi->list_creator_events_creator_events_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | **int**|  | [optional] [default to 1]
 **page_size** | **int**|  | [optional] [default to 20]

### Return type

[**List[EventResponse]**](EventResponse.md)

### Authorization

[HTTPBearer](../README.md#HTTPBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_event_bookings_creator_events_event_id_bookings_get**
> List[CreatorBookingResponse] list_event_bookings_creator_events_event_id_bookings_get(event_id)

List Event Bookings

### Example

* Bearer Authentication (HTTPBearer):

```python
import event_sdk
from event_sdk.models.creator_booking_response import CreatorBookingResponse
from event_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = event_sdk.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: HTTPBearer
configuration = event_sdk.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with event_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = event_sdk.EventsApi(api_client)
    event_id = 56 # int | 

    try:
        # List Event Bookings
        api_response = api_instance.list_event_bookings_creator_events_event_id_bookings_get(event_id)
        print("The response of EventsApi->list_event_bookings_creator_events_event_id_bookings_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling EventsApi->list_event_bookings_creator_events_event_id_bookings_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **event_id** | **int**|  | 

### Return type

[**List[CreatorBookingResponse]**](CreatorBookingResponse.md)

### Authorization

[HTTPBearer](../README.md#HTTPBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_events_events_get**
> List[EventResponse] list_events_events_get(q=q, page=page, page_size=page_size)

List Events

### Example


```python
import event_sdk
from event_sdk.models.event_response import EventResponse
from event_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = event_sdk.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with event_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = event_sdk.EventsApi(api_client)
    q = 'q_example' # str |  (optional)
    page = 1 # int |  (optional) (default to 1)
    page_size = 20 # int |  (optional) (default to 20)

    try:
        # List Events
        api_response = api_instance.list_events_events_get(q=q, page=page, page_size=page_size)
        print("The response of EventsApi->list_events_events_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling EventsApi->list_events_events_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **q** | **str**|  | [optional] 
 **page** | **int**|  | [optional] [default to 1]
 **page_size** | **int**|  | [optional] [default to 20]

### Return type

[**List[EventResponse]**](EventResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **update_event_events_event_id_patch**
> EventResponse update_event_events_event_id_patch(event_id, event_update)

Update Event

### Example

* Bearer Authentication (HTTPBearer):

```python
import event_sdk
from event_sdk.models.event_response import EventResponse
from event_sdk.models.event_update import EventUpdate
from event_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = event_sdk.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: HTTPBearer
configuration = event_sdk.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with event_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = event_sdk.EventsApi(api_client)
    event_id = 56 # int | 
    event_update = event_sdk.EventUpdate() # EventUpdate | 

    try:
        # Update Event
        api_response = api_instance.update_event_events_event_id_patch(event_id, event_update)
        print("The response of EventsApi->update_event_events_event_id_patch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling EventsApi->update_event_events_event_id_patch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **event_id** | **int**|  | 
 **event_update** | [**EventUpdate**](EventUpdate.md)|  | 

### Return type

[**EventResponse**](EventResponse.md)

### Authorization

[HTTPBearer](../README.md#HTTPBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

