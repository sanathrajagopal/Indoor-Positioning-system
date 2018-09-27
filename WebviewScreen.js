import React from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ListView,
  ScrollView,
  AppState,
  Dimensions,
  WebView
} from 'react-native';

import BleManager from 'react-native-ble-manager';
// set up the style for the webview - taking up the entire device screen.

// screen height and width - it's possibly maybe a bad idea to set these once at startup, 
// and assume they'll never change; but fixing that is an exercise for the reader.
const ScreenHeight = Dimensions.get("window").height;
const ScreenWidth = Dimensions.get("window").width;

const window = Dimensions.get('window');

var loc;
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
var my_peripheral;
/*
const styles = StyleSheet.create({
  fullscreen: {
    width: ScreenWidth,
    height: ScreenHeight,
    backgroundColor: 'powderblue' // just to be able to differentiate it for debugging 
    // (though the webview itself covers up the blue, so you won't actually see it in the finished example, 
    // unless you do something unsupported like turn your device sideways)
  },
});
*/
var loc_idx = 0;
var prev_x = 0;

// The webview React component
export default class WebviewScreen extends React.Component {
  static navigationOptions = {
    header: null // This removes the navigation header (where the title normally is), to make things more fullscreen. 
    // You can still use the android back button to navigate back in the navigation stack.
    // Not sure about iOS.
  };


  constructor(props) {
    super(props)

    this.state = {
      scanning:false,
      peripherals: new Map(),
      appState: '',
      device_name: this.props.navigation.state.params.device_name
    }
    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }
  // handle messages sent by webview to React Native. 
  // Just log them to the console for this example.
  onWebViewMessage(event) {
    console.log("from react to web " + event.nativeEvent.data);
  }

  // !NOTE! that this function uses the arrow function format, unlike all other functions.
  // This is yet another unintuitive JS gotcha: it preserves the 'this' reference to always be the WebviewScreen object,
  // event when it's passed in as a callback.
  // Functions defined the 'regular' way lose their 'this' reference when passed to some other object as a callback.
  // Technically, there's probably not a good reason to not use the arrow function for everything.
  onWebViewLoad = () => {
    this.webViewRef.postMessage('loaded');
    // postMessage takes in a string (in both directions).
    // in practice, you will probably want to use JSON.stringify / JSON.parse on both ends to pass structured data.
  }
  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    BleManager.start({showAlert: false});

    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
    this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );



    if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
            if (result) {
              console.log("Permission is OK");
            } else {
              PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                if (result) {
                  console.log("User accept");
                } else {
                  console.log("User refuse");
                }
              });
            }
      });
    }

    this.startScan();
     
  }

  handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
      });
    }
    this.setState({appState: nextAppState});
  }

  componentWillUnmount() {
    this.handlerDiscover.remove();
    this.handlerStop.remove();
    this.handlerDisconnect.remove();
    this.handlerUpdate.remove();
  }

  
handleDisconnectedPeripheral(data) {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({peripherals});
    }
    console.log('Disconnected from ' + data.peripheral);
     setTimeout(() => { this.test(peripheral); }, 200 );
  }

  handleUpdateValueForCharacteristic(data) {
    console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
  }



  startScan() {
    if (!this.state.scanning) {
      this.setState({peripherals: new Map()});
      BleManager.scan([], 3).then((results) => {
        console.log('Scanning...');
        this.setState({scanning:true});
      });
    }
  }

  retrieveConnected(){
    BleManager.getConnectedPeripherals([]).then((results) => {
      console.log(results);
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals });
      }
    });
  }

  handleDiscoverPeripheral(peripheral){
    var peripherals = this.state.peripherals;
    if (!peripherals.has(peripheral.id)){
      console.log('Got ble peripheral------------------------------------------------------------------------', peripheral.id);
//if(peripheral.id == 'D0:05:87:3D:56:29' ){
if(peripheral.name == this.state.device_name ){
      peripherals.set(peripheral.id, peripheral);
      this.setState({ peripherals });
      this.test(peripheral);
}
    }
  }

  test(peripheral) {

console.log('peripheral --->   ' + peripheral);
    if (peripheral){
      if (peripheral.connected){
        BleManager.disconnect(peripheral.id);
      }else{
        BleManager.connect(peripheral.id).then(() => {
          let peripherals = this.state.peripherals;
          let p = peripherals.get(peripheral.id);
    console.log(peripherals);   
          if (p) {
            p.connected = true;
            peripherals.set(peripheral.id, p);
            this.setState({peripherals});
          }
          console.log('Connected to ' + peripheral.id);



          setTimeout(() => {

            /* Test read current RSSI value
            BleManager.retrieveServices(peripheral.id).then((peripheralData) => {
              console.log('Retrieved peripheral services', peripheralData);
              BleManager.readRSSI(peripheral.id).then((rssi) => {
                console.log('Retrieved actual RSSI value', rssi);
              });
            });*/
            BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
              console.log(peripheralInfo);
              var service = '680c21d9-c946-4c1f-9c11-baa1c21329e7';
              var networkID = '80f9d8bc-3bff-45bb-a181-2d6a37991208';
              var locationMode = 'a02b947e-df97-4516-996a-1882521e0ead';
              var location = '003bbdf2-c634-4b3d-ab56-7ec889b89a37';
              var opmode = '3f0afd88-7770-46b0-b5e7-9fc099598964';

              BleManager.write(peripheral.id,service,locationMode,[0]).then(() => {
                console.log('Write 0');
              });

              var handler = setInterval(() => {
                 if (!peripheral.connected){ console.log('return from test =======================> '); clearInterval(handler); return;} else
{
                 BleManager.read(peripheral.id,service,location).then((data) => {
                  console.log('Location : ' + data);
                  var x,y,z,origin=[0,0];
                  x = (data[1]+(data[2]*256)+(data[3]*65536)+(data[4]*16777216))/1000;
                  var x_delta = (prev_x - x)*100;
                  if( x_delta < 0 ) { x_delta = x_delta * -1; }
                  prev_x = x;
                  y = (data[5]+(data[6]*256)+(data[7]*65536)+(data[8]*16777216))/1000;
                  z = (data[9]+(data[10]*256)+(data[11]*65536)+(data[12]*16777216))/1000;
                  console.log('x,y,z , delta: ' + x + ' ' + y + ' ' + z + ' ' + x_delta);
                  origin[0] = 12.973506459647494;  origin[1] = 77.60927930474281;
                  var latlen_per_meter = 0.000008968327696765173;
                  var longlen_per_meter = 0.00000975364041999379;
                  var lat = origin[0]+ y*latlen_per_meter;
                  var long = origin[1]+ x*longlen_per_meter;
                  console.log('Lat : ' + lat + ' Long : ' + long);
                  loc=[{latitude : lat, longitude : long, floor : 4, accuracy : 1}];
                  var loc_str = lat + ":" + long; //flightCoordinates[loc_idx].latitude + ":" + flightCoordinates[loc_idx].longitude;
                 // console.log('Lat : long ' + loc_str);
                  //if(x_delta > 5 ){
                  this.webViewRef.postMessage(loc_str);//}
                  loc_idx = loc_idx + 1;
                  if(loc_idx > 25 ) { loc_idx = 0; }
                });
}
              },300);
            });

          }, 300);
        }).catch((error) => {
          console.log('Connection error', error);
        });
      }
    }
  }



  render() {
    const webviewContent = Platform.OS === 'ios' ? require('C:/Users/Sanath R/newp/android/app/src/main/assets/simplemap.html') : {uri: 'file:///android_asset/simplemap.html'}
    //const list = Array.from(this.state.peripherals.values());
    return (
        <WebView
          onLoadEnd={this.onWebViewLoad}
          ref={webview => {this.webViewRef = webview;}} // stores a reference to the webview object in the WebviewScreen wrapper, to use for postMessage
          source={webviewContent}
           domStorageEnabled
           javaScriptEnabled
          onMessage={this.onWebViewMessage}
        />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    width: window.width,
    height: window.height
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});


