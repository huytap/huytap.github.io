var config = module.exports = {};
config.host = 'localhost';
config.user = 'root';
config.pass = '';
config.db = 'music';

if(process.env.PORT){
    config.host = 'remotemysql.com';
    config.user = '9msGdx3POW';
    config.pass = 'LJhy8huETf';
    config.db = '9msGdx3POW';
}