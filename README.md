# Kafka-Replay-Service

A simple REST (+ websockets) service to play (publish) a sequence of messages to a Kafka topic. The messages you can play are based on their location in a folder (following the convention over configuration principle). The folder is actively watched, and new files will be automatically available.

The REST API at [hostname:port] is as follows:

- To show all sessions
GET /api/v1

- To show a particular session
GET /api/v1/:SESSION_NAME/

- To play, pause (if timed) and stop (if timed) a whole session
POST /api/v1/:SESSION_NAME/
Body { action: PLAY | PAUSE | STOP }

- To play (send) a particular message
POST /api/v1/:SESSION_NAME/:ID
Body { action: PLAY }

Via websockets, your client may receive a `session_update` notification that something has changed, after which you should GET all session data again.

## Log folder layout

The log folder follows the following convention:

- logs
  - session_name
    - topic_name
      - message_file

Messages that belong to each other are added to the same session. The topic name is the name of the topic to publish the messages to.

## Filename
The message file's filename convention informs us when to send it:
- It is just a name: you can publish them step-by-step or all in one go
- It is in the format 12345... (only numbers, or, in Regex /d+): it represents the offset in msec since you pressed play
- Optionally, the previous format may be augmented by a textual description, such as 0001_Init_msg, in which case the 'Init msg' is used as the label of the message in the GUI.

## Extension
Finally, the message file's extension informs us how to read it. We support the following inputs:
- .xml, for XML messages
- .json or .geojson for JSON and GeoJSON messages, respectively.

## Use cases


## Use cases (TO BE DONE)

### Playback step-by-step

The user can select a `session_name` from the GUI, and either send messages by selecting them, and pressing play, or by sending them one after another (batch mode).
In case we are dealing with multiple topics, the user can unselect specific topics in batch mode.

### Playback time-based

Alternatively, if time information is present, the sequence can be played in real-time.

### Playback scenario-based

Finally, if there is a time message signal on the test-bed, playback messages based on the external clock. The scenario duration is used to determine when to send a message.