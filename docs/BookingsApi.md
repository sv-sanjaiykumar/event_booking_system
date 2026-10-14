# event_sdk.BookingsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**book_event_events_event_id_book_post**](BookingsApi.md#book_event_events_event_id_book_post) | **POST** /events/{event_id}/book | Book Event
[**cancel_booking_bookings_booking_id_delete**](BookingsApi.md#cancel_booking_bookings_booking_id_delete) | **DELETE** /bookings/{booking_id} | Cancel Booking
[**get_booking_bookings_booking_id_get**](BookingsApi.md#get_booking_bookings_booking_id_get) | **GET** /bookings/{booking_id} | Get Booking
[**list_my_bookings_bookings_me_get**](BookingsApi.md#list_my_bookings_bookings_me_get) | **GET** /bookings/me | List My Bookings


# **book_event_events_event_id_book_post**
> BookingResponse book_event_events_event_id_book_post(event_id)

Book Event

### Example

* Bearer Authentication (HTTPBearer):

```python
import event_sdk
from event_sdk.models.booking_response import BookingResponse
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
    api_instance = event_sdk.BookingsApi(api_client)
    event_id = 56 # int | 

    try:
        # Book Event
        api_response = api_instance.book_event_events_event_id_book_post(event_id)
        print("The response of BookingsApi->book_event_events_event_id_book_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BookingsApi->book_event_events_event_id_book_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **event_id** | **int**|  | 

### Return type

[**BookingResponse**](BookingResponse.md)

### Authorization

[HTTPBearer](../README.md#HTTPBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **cancel_booking_bookings_booking_id_delete**
> cancel_booking_bookings_booking_id_delete(booking_id)

Cancel Booking

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
    api_instance = event_sdk.BookingsApi(api_client)
    booking_id = 56 # int | 

    try:
        # Cancel Booking
        api_instance.cancel_booking_bookings_booking_id_delete(booking_id)
    except Exception as e:
        print("Exception when calling BookingsApi->cancel_booking_bookings_booking_id_delete: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **booking_id** | **int**|  | 

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

# **get_booking_bookings_booking_id_get**
> BookingResponse get_booking_bookings_booking_id_get(booking_id)

Get Booking

### Example

* Bearer Authentication (HTTPBearer):

```python
import event_sdk
from event_sdk.models.booking_response import BookingResponse
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
    api_instance = event_sdk.BookingsApi(api_client)
    booking_id = 56 # int | 

    try:
        # Get Booking
        api_response = api_instance.get_booking_bookings_booking_id_get(booking_id)
        print("The response of BookingsApi->get_booking_bookings_booking_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BookingsApi->get_booking_bookings_booking_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **booking_id** | **int**|  | 

### Return type

[**BookingResponse**](BookingResponse.md)

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

# **list_my_bookings_bookings_me_get**
> List[MyBookingResponse] list_my_bookings_bookings_me_get()

List My Bookings

### Example

* Bearer Authentication (HTTPBearer):

```python
import event_sdk
from event_sdk.models.my_booking_response import MyBookingResponse
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
    api_instance = event_sdk.BookingsApi(api_client)

    try:
        # List My Bookings
        api_response = api_instance.list_my_bookings_bookings_me_get()
        print("The response of BookingsApi->list_my_bookings_bookings_me_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BookingsApi->list_my_bookings_bookings_me_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[MyBookingResponse]**](MyBookingResponse.md)

### Authorization

[HTTPBearer](../README.md#HTTPBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

