# Page & login

* **GET** /
* **POST** /login

# updating settings

* **GET** /settings
* **POST** /settings

# Adding and removing image md5s or phashes from the blacklist

* **GET** /images/blacklist
* **PUT** /images/blacklist
* **DELETE** /images/blacklist

# API calls should all have an API token for auth

* **POST** /api/image
* **POST** /api/dns-address
* **POST** /api/mobile-device
* **POST** /api/user-agent
* **POST** /api/vulnerability
* **POST** /api/account
* **POST** /api/protocol

# Websocket event types

* image
* account
* protocol
* mobile_device
* user_agent
* vulnerability
* blacklist

# Websocket Info

On connection, we should push the last 200 images, and all of the relevent information needed to 
paint the page. 


# DB Models

**image**
 - id
 - (md5|sha1) -- Not sure which is faster yet
 - phash
 - score 
 - url
 - filename 
 - timestamp
 - count

**account**
 - id
 - username
 - password
 - information
 - protocol
 - dns
 - timestamp
 - parser

**protocol**
 - id
 - name

**protocol_counts**
 - id
 - protocol_id
 - count
 - timestamp
 - parser

**mobile_device**
 - id
 - name
 - parser
 - timestamp

**user_agent**
 - id
 - ua_string
 - parser
 - timestamp

**vulnerability**
 - id
 - source_port
 - source_ip
 - dest_port
 - dest_ip
 - name
 - plugin_id
 - risk
 - protocol
 - timestamp
 - parser