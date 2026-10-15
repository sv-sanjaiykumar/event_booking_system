# MyBookingResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **int** |  | 
**event_id** | **int** |  | 
**user_name** | **str** |  | 
**quantity** | **int** |  | 
**booking_date** | **datetime** |  | 
**event_name** | **str** |  | 
**event_date** | **datetime** |  | 
**event_status** | **str** |  | 

## Example

```python
from event_sdk.models.my_booking_response import MyBookingResponse

# TODO update the JSON string below
json = "{}"
# create an instance of MyBookingResponse from a JSON string
my_booking_response_instance = MyBookingResponse.from_json(json)
# print the JSON string representation of the object
print(MyBookingResponse.to_json())

# convert the object into a dict
my_booking_response_dict = my_booking_response_instance.to_dict()
# create an instance of MyBookingResponse from a dict
my_booking_response_from_dict = MyBookingResponse.from_dict(my_booking_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


