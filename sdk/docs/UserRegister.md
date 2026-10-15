# UserRegister


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | 
**email** | **str** |  | 
**password** | **str** |  | 
**role** | [**UserRole**](UserRole.md) |  | 

## Example

```python
from event_sdk.models.user_register import UserRegister

# TODO update the JSON string below
json = "{}"
# create an instance of UserRegister from a JSON string
user_register_instance = UserRegister.from_json(json)
# print the JSON string representation of the object
print(UserRegister.to_json())

# convert the object into a dict
user_register_dict = user_register_instance.to_dict()
# create an instance of UserRegister from a dict
user_register_from_dict = UserRegister.from_dict(user_register_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


