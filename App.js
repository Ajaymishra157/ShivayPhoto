import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import RouteNavigation from './Screens/Navigation/RouteNavigation'
import { enableScreens } from 'react-native-screens';
enableScreens(false);

const App = () => {
  return (
    <RouteNavigation />
  )
}

export default App

const styles = StyleSheet.create({})