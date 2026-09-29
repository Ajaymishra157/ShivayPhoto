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

const Card = () => (
    <View style={styles.card}>
        <View style={styles.topRow}>
            <Block style={styles.indexBlock} />
            <Block style={styles.badgeBlock} />
        </View>

        <View style={styles.staffRow}>
            <Block style={styles.avatarBlock} />
            <Block style={styles.nameBlock} />
            <View style={{ flex: 1 }} />
            <Block style={styles.amountBlock} />
        </View>

        <Block style={styles.reasonBlock} />

        <View style={styles.divider} />

        <View style={styles.dateRow}>
            <Block style={styles.dateBlock} />
            <Block style={styles.dateBlock} />
        </View>
    </View>
);

const Penaltylistshimmer = ({ count = 6 }) => {
    return (
        <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
            {Array.from({ length: count }).map((_, i) => <Card key={i} />)}
        </View>
    );
};

export default Penaltylistshimmer;

const styles = StyleSheet.create({
    block: { backgroundColor: '#e2e8f0', borderRadius: 6 },

    card: {
        backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 10, marginVertical: 5, borderWidth: 1, borderColor: '#eee',
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    indexBlock: { width: 24, height: 10, borderRadius: 4 },
    badgeBlock: { width: 60, height: 16, borderRadius: 10 },

    staffRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    avatarBlock: { width: 24, height: 24, borderRadius: 12 },
    nameBlock: { width: 100, height: 13, borderRadius: 4 },
    amountBlock: { width: 50, height: 15, borderRadius: 4 },

    reasonBlock: { width: '80%', height: 11, borderRadius: 4, marginTop: 8 },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },

    dateRow: { flexDirection: 'row', gap: 14 },
    dateBlock: { width: 100, height: 11, borderRadius: 4 },
});