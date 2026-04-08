// src/components/ToastConfig.js
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from './Commoncomponent/Constants'

const toastConfig = {
    success: ({ text1, text2 }) => {
        return (
            <View style={styles.container}>
                <View style={styles.toastBox}>
                    <View style={styles.leftBar} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{text1}</Text>
                        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
                    </View>
                </View>
            </View>
        )
    },
}

const styles = StyleSheet.create({
    container: {
        width: '90%',
        alignSelf: 'center',
        marginBottom: 10,
    },
    toastBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightappcolor,
        padding: 16,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
    },
    leftBar: {
        width: 5,
        height: '100%',
        backgroundColor: '#7367f0',
        borderRadius: 4,
        marginRight: 12,
    },
    title: {
        fontSize: 15,
        fontFamily: 'Inter-SemiBold',
        color: '#0F172A',
    },
    message: {
        fontSize: 13,
        color: '#000',
        fontFamily: 'Inter-Regular',
        marginTop: 2,
    },
})

export default toastConfig
