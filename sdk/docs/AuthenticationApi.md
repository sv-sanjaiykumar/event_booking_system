# event_sdk.AuthenticationApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_me_auth_me_get**](AuthenticationApi.md#get_me_auth_me_get) | **GET** /auth/me | Get Me
[**login_auth_login_post**](AuthenticationApi.md#login_auth_login_post) | **POST** /auth/login | Login
[**logout_auth_logout_post**](AuthenticationApi.md#logout_auth_logout_post) | **POST** /auth/logout | Logout
[**register_auth_register_post**](AuthenticationApi.md#register_auth_register_post) | **POST** /auth/register | Register


# **get_me_auth_me_get**
> UserResponse get_me_auth_me_get()

Get Me

### Example

* Bearer Authentication (HTTPBearer):

```python
import event_sdk
from event_sdk.models.user_response import UserResponse
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
    api_instance = event_sdk.AuthenticationApi(api_client)

    try:
        # Get Me
        api_response = api_instance.get_me_auth_me_get()
        print("The response of AuthenticationApi->get_me_auth_me_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthenticationApi->get_me_auth_me_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**UserResponse**](UserResponse.md)

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

# **login_auth_login_post**
> TokenResponse login_auth_login_post(user_login)

Login

### Example


```python
import event_sdk
from event_sdk.models.token_response import TokenResponse
from event_sdk.models.user_login import UserLogin
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
    api_instance = event_sdk.AuthenticationApi(api_client)
    user_login = event_sdk.UserLogin() # UserLogin | 

    try:
        # Login
        api_response = api_instance.login_auth_login_post(user_login)
        print("The response of AuthenticationApi->login_auth_login_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthenticationApi->login_auth_login_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **user_login** | [**UserLogin**](UserLogin.md)|  | 

### Return type

[**TokenResponse**](TokenResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logout_auth_logout_post**
> logout_auth_logout_post()

Logout

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
    api_instance = event_sdk.AuthenticationApi(api_client)

    try:
        # Logout
        api_instance.logout_auth_logout_post()
    except Exception as e:
        print("Exception when calling AuthenticationApi->logout_auth_logout_post: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

void (empty response body)

### Authorization

[HTTPBearer](../README.md#HTTPBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**204** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **register_auth_register_post**
> UserResponse register_auth_register_post(user_register)

Register

### Example


```python
import event_sdk
from event_sdk.models.user_register import UserRegister
from event_sdk.models.user_response import UserResponse
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
    api_instance = event_sdk.AuthenticationApi(api_client)
    user_register = event_sdk.UserRegister() # UserRegister | 

    try:
        # Register
        api_response = api_instance.register_auth_register_post(user_register)
        print("The response of AuthenticationApi->register_auth_register_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthenticationApi->register_auth_register_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **user_register** | [**UserRegister**](UserRegister.md)|  | 

### Return type

[**UserResponse**](UserResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

