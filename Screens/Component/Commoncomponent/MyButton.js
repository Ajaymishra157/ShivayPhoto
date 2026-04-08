import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Colors } from './Constants';

const MyButton = (props) => {
    const btnname = props.btnname;
    const btnWidth = props.btnWidth;
    const runFunc = props.runFunc;
    const background = props.background;
    const textcolor = props.textcolor;
    const fontsize = props.fontsize;
    const fontfamily = props.fontfamily;
    const disabled = props.disabled;


    return (
        <TouchableOpacity disabled={disabled} onPress={runFunc} style={{ width: btnWidth, backgroundColor: background ? background : Colors.buttonbgcolor, paddingVertical: 10, borderRadius: 20, alignItems: 'center' }}>
            <Text style={{ color: textcolor, fontSize: fontsize, fontFamily: fontfamily }}>
                {btnname}
            </Text>
        </TouchableOpacity>
    )
}

export default MyButton