# BookingCreate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**quantity** | **int** |  | [optional] [default to 1]
**attendee_names** | **List[str]** |  | [optional]
**includes_booker** | **bool** | Whether the signed-in attendee is included as one of the seat holders. | [optional] [default to True]

## Example

```python
from event_sdk.models.booking_create import BookingCreate

# TODO update the JSON string below
json = "{}"
# create an instance of BookingCreate from a JSON string
booking_create_instance = BookingCreate.from_json(json)
# print the JSON string representation of the object
print(BookingCreate.to_json())

# convert the object into a dict
booking_create_dict = booking_create_instance.to_dict()
# create an instance of BookingCreate from a dict
booking_create_from_dict = BookingCreate.from_dict(booking_create_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

