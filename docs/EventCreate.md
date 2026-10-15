# EventCreate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**location** | **str** | Venue address for the event. | [optional]
**total_seats** | **int** |  | 
**var_date** | **datetime** |  | 

## Example

```python
from event_sdk.models.event_create import EventCreate

# TODO update the JSON string below
json = "{}"
# create an instance of EventCreate from a JSON string
event_create_instance = EventCreate.from_json(json)
# print the JSON string representation of the object
print(EventCreate.to_json())

# convert the object into a dict
event_create_dict = event_create_instance.to_dict()
# create an instance of EventCreate from a dict
event_create_from_dict = EventCreate.from_dict(event_create_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


