const Sequelize = require('SEQUELIZE')

// WE WILL NEED TO REPLACE THIS LATER WITH THE RIGHT METHOD!!!
var sequelize = new Sequelize(db_uri)

var Image = sequelize.define('image', {
  hash: {type: Sequelize.STRING(32), primaryKey: true},
  phash: {type: Sequelize.STRING(32)},
  score: {type: Sequelize.INTEGER, defaultValue: -1},
  count: {type: Sequelize.INTEGER, defaultValue: 0},
  filename: {type: Sequelize.STRING(42), unique: true},
  timestamp: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
})

var Account = sequelize.define('account', {
  id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  username: {type: Sequelize.STRING},
  password: {type: Sequelize.STRING},
  protocol: {type: Sequelize.STRING},
  location: {type: Sequelize.STRING},
  information: {type: Sequelize.STRING},
  timestamp: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  count: {type: Sequelize.INTEGER, defaultValue: 0}
})

var Host = sequelize.define('host', {
  id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  address: {type: Sequelize.STRING(16)},
  score: {type: Sequelize.INTEGER, defaultValue: 0},
  critical: {type: Sequelize.INTEGER, defaultValue: 0},
  high: {type: Sequelize.INTEGER, defaultValue: 0},
  medium: {type: Sequelize.INTEGER, defaultValue: 0},
  low: {type: Sequelize.INTEGER, defaultValue: 0},
  timestamp: {type: Sequelize.DATE, defaultValue: Sequelize.NOW}
})

var Vulnerability = sequelize.define('vuln', {
  id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  vuln_id: {type: Sequelize.INTEGER, unique: true},
  name: {type: Sequelize.TEXT},
  severity: {type: Sequelize.STRING(8)},
  count: {type: Sequelize.INTEGER, defaultValue: 0},
  timestamp: {type: Sequelize.DATE, defaultValue: Sequelize.NOW}
})

var Protocol = sequelize.define('protocol',
  id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  name: {type: Sequelize.STRING(32)},
  timestamp: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  count: {type: Sequelize.INTEGER, defaultValue: 0}
})

var DNSAddress = sequelize.define('dns_address', {
  address: {type: Sequelize.STRING(128), primaryKey: true},
  timestamp: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  count: {type: Sequelize.INTEGER, defaultValue: 0}
})

var MobileDevice = sequelize.define('mobile_device', {
  name: {type: Sequelize.STRING(128), primaryKey: true},
  timestamp: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  count: {type: Sequelize.INTEGER, defaultValue: 0}
})

var UserAgent = sequelize.define('user_agent', {
  string: {type: Sequelize.STRING(255), primaryKey: true},
  timestamp: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  count: {type: Sequelize.INTEGER, defaultValue: 0}
})

var Blacklist = sequelize.define('blacklist', {
  id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  hash: {type: Sequelize.STRING(32)},
  phash: {type: Sequelize.STRING(32)}
})

// Object relationships
Host.belongsToMany(Vulnerability, {through: 'VulnHost'})
Vulnerability.belongsToMany(Host, {through: 'VulnHost'})

// Commit the schema to the database
Image.sync()
Account.sync()
Protocol.sync()
DNSAddress.sync()
MobileDevice.sync()
UserAgent.sync()
Blacklist.sync()

module.exports = {
  Image: Image,
  Host: Host,
  Vulnerability: Vulnerability,
  Account: Account,
  Protocol: Protocol,
  DNSAddress: DNSAddress,
  MobileDevice: MobileDevice,
  UserAgent: UserAgent,
  Blacklist: Blacklist
}