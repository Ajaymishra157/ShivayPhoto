import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const Block = ({ style }) => {
    const pulse = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return <Animated.View style={[styles.block, style, { opacity: pulse }]} />;
};

const Row = () => (
    <View style={styles.rowWrap}>
        <Block style={styles.iconBlock} />
        <View style={{ flex: 1 }}>
            <Block style={styles.labelBlock} />
            <Block style={styles.valueBlock} />
        </View>
    </View>
);

const Penaltydetailshimmer = () => {
    return (
        <View style={{ padding: 14 }}>
            <View style={styles.card}>
                <View style={styles.topRow}>
                    <Block style={styles.nameBlock} />
                    <Block style={styles.badgeBlock} />
                </View>

                <View style={styles.divider} />

                <Row />
                <Row />
                <Row />
                <Row />
                <Row />
            </View>
        </View>
    );
};

export default Penaltydetailshimmer;

const styles = StyleSheet.create({
    block: { backgroundColor: '#e2e8f0', borderRadius: 6 },

    card: {
        backgroundColor: '#fff', borderRadius: 10, padding: 16,
        borderWidth: 1, borderColor: '#eee',
    },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    nameBlock: { width: '55%', height: 18, borderRadius: 4 },
    badgeBlock: { width: 70, height: 24, borderRadius: 20 },

    divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },

    rowWrap: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9', gap: 12,
    },
    iconBlock: { width: 34, height: 34, borderRadius: 10 },
    labelBlock: { width: 60, height: 10, borderRadius: 4, marginBottom: 6 },
    valueBlock: { width: '70%', height: 13, borderRadius: 4 },
});