import { View, Text, TouchableOpacity, StatusBar } from 'react-native'
import React from 'react'
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts } from './Constants';

const Header = ({ headername}) => {
    const navigation = useNavigation();
    return (
        <View>
            <StatusBar backgroundColor={Colors.appcolor} barStyle="dark-content" />
            <View style={{ backgroundColor: Colors.appcolor, flexDirection: 'row', height: 50, alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 10 }}>
                    <Feather name="arrow-left" size={25} color={Colors.btntext} />
                </TouchableOpacity>
                <Text numberOfLines={1} style={{ color: '#000', fontFamily: Fonts.Bold, fontSize: 16, marginLeft: 0 }}>{headername}</Text>
                <Text style={{ color: Colors.appcolor, fontFamily: 'Inter-Regular', fontSize: 18, marginLeft: 20 }}>..</Text>
            </View>
        </View>
    )
}

export default Header