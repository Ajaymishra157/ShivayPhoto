import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Login from '../Component/Login';
import Dashboard from '../Component/Dashboard';
import { Colors } from '../Component/Commoncomponent/Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import toastConfig from '../Component/toastConfig';

import Menus from '../Component/Menus';
import UsersList from '../Component/Users/UsersList';
import UsersDetail from '../Component/Users/UsersDetail';
import AddUser from '../Component/Users/AddUser';
import SourceList from '../Component/Source/SourceList';
import AddSource from '../Component/Source/AddSource';
import PurposeList from '../Component/Purpose/PurposeList';
import AddPurpose from '../Component/Purpose/AddPurpose';
import ChangePassword from '../Component/ChangePassword';
import LeadsDashboard from '../Component/Leads/LeadsDashboard';
import ReportsDashboard from '../Component/Reports/ReportsDashboard';
import MonthReport from '../Component/Reports/MonthReport';
import MixReport from '../Component/Reports/MixReport';
import AddLeads from '../Component/Leads/AddLeads';
import ManageLeads from '../Component/Leads/ManageLeads';
import PdfViewerScreen from '../Component/Leads/PdfViewerScreen';
import managebookingdashboard from '../Component/Managebooking/managebookingdashboard';
import Bookinglist from '../Component/Managebooking/Bookinglist';
import Calendarlist from '../Component/Managebooking/Calendarlist';
import LeadTransfetList from '../Component/LeadTransfer/LeadTransfetList';
import LeadDetail from '../Component/Leads/LeadDetail';
import PendingLeadList from '../Component/Leads/PendingLeadList';
import BookingDetail from '../Component/Managebooking/BookingDetail';
import AddBooking from '../Component/Managebooking/AddBooking';


const Stack = createNativeStackNavigator();


const RouteNavigation = () => {

  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const id = await AsyncStorage.getItem('id');

        if (id) {
          setInitialRoute('Dashboard')
        } else {
          setInitialRoute('Login');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setInitialRoute('Login');
      }
    };

    if (!initialRoute) {
      checkLoginStatus();
    }
  }, [initialRoute]);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.appcolor} />
      </View>
    );
  }
  return (
    <NavigationContainer>

      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name='Login' component={Login} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='Dashboard' component={Dashboard} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='Menus' component={Menus} options={{ headerShown: false, animation: 'slide_from_left' }} />
        <Stack.Screen name='ChangePassword' component={ChangePassword} options={{ headerShown: false, animation: 'slide_from_right' }} />


        <Stack.Screen name='UsersList' component={UsersList} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='UsersDetail' component={UsersDetail} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='AddUser' component={AddUser} options={{ headerShown: false, animation: 'slide_from_right' }} />


        <Stack.Screen name='SourceList' component={SourceList} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='AddSource' component={AddSource} options={{ headerShown: false, animation: 'slide_from_right' }} />

        <Stack.Screen name='PurposeList' component={PurposeList} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='AddPurpose' component={AddPurpose} options={{ headerShown: false, animation: 'slide_from_right' }} />


        <Stack.Screen name='LeadsDashboard' component={LeadsDashboard} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='AddLeads' component={AddLeads} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='ManageLeads' component={ManageLeads} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='PdfViewerScreen' component={PdfViewerScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='LeadTransferList' component={LeadTransfetList} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='LeadDetail' component={LeadDetail} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='PendingLeadList' component={PendingLeadList} options={{ headerShown: false, animation: 'slide_from_right' }} />

        <Stack.Screen name='ReportsDashboard' component={ReportsDashboard} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='MonthReport' component={MonthReport} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='MixReport' component={MixReport} options={{ headerShown: false, animation: 'slide_from_right' }} />


        <Stack.Screen name='managebookingdashboard' component={managebookingdashboard} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='Bookinglist' component={Bookinglist} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='Calendarlist' component={Calendarlist} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='BookingDetail' component={BookingDetail} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name='AddBooking' component={AddBooking} options={{ headerShown: false, animation: 'slide_from_right' }} />

      </Stack.Navigator>
      <Toast config={toastConfig} />
    </NavigationContainer>
  );
};



export default RouteNavigation;

const styles = StyleSheet.create({});
