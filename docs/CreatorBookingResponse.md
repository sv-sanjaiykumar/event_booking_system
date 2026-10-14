# CreatorBookingResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **int** |  | 
**event_id** | **int** |  | 
**user_name** | **str** |  | 
**booking_date** | **datetime** |  | 

## Example

```python
from event_sdk.models.creator_booking_response import CreatorBookingResponse

# TODO update the JSON string below
json = "{}"
# create an instance of CreatorBookingResponse from a JSON string
creator_booking_response_instance = CreatorBookingResponse.from_json(json)
# print the JSON string representation of the object
print(CreatorBookingResponse.to_json())

# convert the object into a dict
creator_booking_response_dict = creator_booking_response_instance.to_dict()
# create an instance of CreatorBookingResponse from a dict
creator_booking_response_from_dict = CreatorBookingResponse.from_dict(creator_booking_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


