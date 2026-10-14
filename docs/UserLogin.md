# UserLogin


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**email** | **str** |  | 
**password** | **str** |  | 

## Example

```python
from event_sdk.models.user_login import UserLogin

# TODO update the JSON string below
json = "{}"
# create an instance of UserLogin from a JSON string
user_login_instance = UserLogin.from_json(json)
# print the JSON string representation of the object
print(UserLogin.to_json())

# convert the object into a dict
user_login_dict = user_login_instance.to_dict()
# create an instance of UserLogin from a dict
user_login_from_dict = UserLogin.from_dict(user_login_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


