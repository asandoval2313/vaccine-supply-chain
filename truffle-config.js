module.exports = {
  networks: {
   development: {
     host: "127.0.0.1",
     port: 8545,
     network_id: "*"
   },
   test: {
     host: "127.0.0.1",
     port: 7545,
     network_id: "*"
   }
  },
  compilers: {
    solc: {
      version: ">=0.7.0 <0.9.0"
    }
  }
  
};
