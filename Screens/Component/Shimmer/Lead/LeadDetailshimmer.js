import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const LeadDetailshimmer = () => {

    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    const Shimmer = ({ style }) => (
        <View style={[styles.shimmerBox, style]}>
            <Animated.View style={[styles.absoluteFill, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['#e5e7eb', '#f1f5f9', '#e5e7eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: '100%', height: '100%' }}
                />
            </Animated.View>
        </View>
    );

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header} />

            {/* HERO */}
            <View style={styles.hero}>
                <Shimmer style={styles.avatar} />
                <View style={{ flex: 1 }}>
                    <Shimmer style={styles.lineLg} />
                    <Shimmer style={styles.lineSm} />
                    <Shimmer style={styles.lineSm} />
                    <Shimmer style={styles.badge} />
                </View>
            </View>

            {/* CARD 1 */}
            <View style={styles.card}>
                <Shimmer style={styles.lineTitle} />
                {[...Array(6)].map((_, i) => (
                    <Shimmer key={i} style={styles.lineRow} />
                ))}
            </View>

            {/* CARD 2 */}
            <View style={styles.card}>
                <Shimmer style={styles.lineTitle} />
                <Shimmer style={styles.lineRow} />
                <Shimmer style={styles.lineRow} />
            </View>

            {/* TIMELINE */}
            <View style={styles.card}>
                <Shimmer style={styles.lineTitle} />
                {[...Array(4)].map((_, i) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 12 }}>
                        <Shimmer style={styles.timelineDot} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Shimmer style={styles.lineSm} />
                            <Shimmer style={styles.lineRow} />
                        </View>
                    </View>
                ))}
            </View>

        </View>
    );
};

export default LeadDetailshimmer;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f7fa',
        paddingBottom: 20
    },

    header: {
        height: 60,
        backgroundColor: '#e5e7eb'
    },

    hero: {
        backgroundColor: '#e5e7eb',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center'
    },

    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 12
    },

    badge: {
        width: 100,
        height: 20,
        borderRadius: 20,
        marginTop: 10
    },

    card: {
        backgroundColor: '#fff',
        margin: 12,
        padding: 14,
        borderRadius: 12
    },

    shimmerBox: {
        overflow: 'hidden',
        backgroundColor: '#e5e7eb'
    },

    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
    },

    lineTitle: {
        height: 18,
        width: '40%',
        borderRadius: 6,
        marginBottom: 12
    },

    lineLg: {
        height: 18,
        width: '70%',
        borderRadius: 6,
        marginBottom: 8
    },

    lineSm: {
        height: 12,
        width: '50%',
        borderRadius: 6,
        marginBottom: 6
    },

    lineRow: {
        height: 14,
        width: '100%',
        borderRadius: 6,
        marginBottom: 10
    },

    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4
    }
});