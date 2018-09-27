
// In case you are as unfamiliar with nuances of modern JS as I once was 
// (and just wanted to make apps quickly without divining unintuitive JS conventions),
// the import without { } corresponds to 'export default', and you can use any name at all, and it will happily rename whatever was exported.
// The import with { } corresponds to named exports, i.e. without 'default', which IMO is the saner method, as it makes it easier to follow export chains.
import React from 'react';
import { StackNavigator } from 'react-navigation';
import { Text, View, Button, StyleSheet, TouchableOpacity, Icon, Image, TextInput } from 'react-native';

import WebviewScreen from './WebviewScreen'

console.disableYellowBox = true; 

// HomeScreen is the screen that is shown when you first open the app.
// It has a button that takes you to the webview.
var device_name;

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Nanotel IPS'
  };
   handlePeripheral = (text) => {
      device_name = text;
   }
  render() {
    const { navigate } = this.props.navigation;
    return (
    <View style={styles.container} >

    <TextInput style={styles.input}
      underlineColorAndroid = "transparent"
      placeholder = "Device Name"
      placeholderTextColor = "lightBlue"
      autoCapitalize = "none"
      onChangeText = {this.handlePeripheral} /> 

    <Image style={{width: 210,
     height: 150,
     marginTop: 40,
     marginLeft: 80}} source={require('./Nanotel-Logo.png')} />

    <TouchableOpacity
      title='Go to webview'
      style={{
       marginTop:70,
       marginLeft:130,
       paddingTop:15,
       paddingBottom:15,
       marginLeft:30,
       marginRight:30,
       backgroundColor:'#00BCD4',
       borderRadius:10,
       borderWidth: 1,
       borderColor: '#fff'
       }}
      onPress={() => navigate('Webview',{device_name: device_name})} // the 'Webview' here matches the Webview key in the StackNavigator below.
      >
        <Text style={{color:'#fff',
          textAlign:'center', fontSize:20}}>  Start Navigation </Text>
       </TouchableOpacity>

      </View>
        );
  }
}

// Below is the app object, specified as a StackNavigator and then wrapped into a component.
const WebviewApp = StackNavigator({
  Home: { screen: HomeScreen },
  Webview: { screen: WebviewScreen },
});

export default class App extends React.Component {   
  render() {
    return <WebviewApp/>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    width: window.width,
    height: window.height
  },
  button: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
   input: {
      margin: 15,
      height: 40,
      borderColor: 'black',
      borderWidth: 1,
      marginTop: 30
   }
});