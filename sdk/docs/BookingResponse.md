# BookingResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **int** |  | 
**event_id** | **int** |  | 
**user_name** | **str** |  | 
**quantity** | **int** |  | 
**attendee_names** | **List[str]** |  |
**seat_numbers** | **List[int]** | Event seat numbers assigned to this booking. |
**includes_booker** | **bool** | Whether the signed-in attendee is one of the seat holders. |
**booking_date** | **datetime** |  | 

## Example

```python
from event_sdk.models.booking_response import BookingResponse

# TODO update the JSON string below
json = "{}"
# create an instance of BookingResponse from a JSON string
booking_response_instance = BookingResponse.from_json(json)
# print the JSON string representation of the object
print(BookingResponse.to_json())

# convert the object into a dict
booking_response_dict = booking_response_instance.to_dict()
# create an instance of BookingResponse from a dict
booking_response_from_dict = BookingResponse.from_dict(booking_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

