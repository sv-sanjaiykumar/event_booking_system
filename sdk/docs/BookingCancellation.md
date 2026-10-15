# BookingCancellation


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**seat_numbers** | **List[int]** |  | 

## Example

```python
from event_sdk.models.booking_cancellation import BookingCancellation

# TODO update the JSON string below
json = "{}"
# create an instance of BookingCancellation from a JSON string
booking_cancellation_instance = BookingCancellation.from_json(json)
# print the JSON string representation of the object
print(BookingCancellation.to_json())

# convert the object into a dict
booking_cancellation_dict = booking_cancellation_instance.to_dict()
# create an instance of BookingCancellation from a dict
booking_cancellation_from_dict = BookingCancellation.from_dict(booking_cancellation_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


