import React from 'react';
import { View } from 'react-native';

const ShimmerCard = () => (
    <View style={{
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginVertical: 6,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
    }}>
        {/* ROW 1: # + status + 3-dot */}
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <View style={{ width: 24, height: 12, borderRadius: 4, backgroundColor: '#e5e7eb' }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 20, borderRadius: 10, backgroundColor: '#e5e7eb', marginRight: 8 }} />
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#e5e7eb' }} />
            </View>
        </View>

        {/* DIVIDER */}
        <View style={{ height: 0.5, backgroundColor: '#e2e8f0', marginVertical: 7 }} />

        {/* PACKAGE ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 50, height: 12, borderRadius: 4, backgroundColor: '#e5e7eb', marginRight: 12 }} />
            <View style={{ flex: 1, height: 12, borderRadius: 4, backgroundColor: '#eef0f3' }} />
        </View>

        {/* BRANCH ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ width: 50, height: 12, borderRadius: 4, backgroundColor: '#e5e7eb', marginRight: 12 }} />
            <View style={{ width: '60%', height: 12, borderRadius: 4, backgroundColor: '#eef0f3' }} />
        </View>

        {/* ENTRY DATE */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ width: 60, height: 11, borderRadius: 4, backgroundColor: '#e5e7eb', marginRight: 8 }} />
            <View style={{ width: 110, height: 11, borderRadius: 4, backgroundColor: '#eef0f3' }} />
        </View>
    </View>
);

const Listpackageshimmer = () => {
    return (
        <View style={{ paddingTop: 4, paddingHorizontal: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
                <ShimmerCard key={i} />
            ))}
        </View>
    );
};

export default Listpackageshimmer;