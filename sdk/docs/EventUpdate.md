# EventUpdate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**location** | **str** | Venue address for the event. | [optional]
**total_seats** | **int** |  | [optional] 
**var_date** | **datetime** |  | [optional] 

## Example

```python
from event_sdk.models.event_update import EventUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of EventUpdate from a JSON string
event_update_instance = EventUpdate.from_json(json)
# print the JSON string representation of the object
print(EventUpdate.to_json())

# convert the object into a dict
event_update_dict = event_update_instance.to_dict()
# create an instance of EventUpdate from a dict
event_update_from_dict = EventUpdate.from_dict(event_update_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


