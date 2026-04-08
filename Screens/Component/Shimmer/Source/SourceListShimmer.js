// SourceListShimmer.js
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const SHIMMER_ITEM_COUNT = 6;

const ShimmerRow = () => {
    return (
        <View style={styles.rowContainer}>
            {/* ROW 1: Index + Toggle + 3-dot */}
            <View style={styles.rowTop}>
                {/* INDEX */}
                <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    style={styles.indexShimmer}
                    shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
                />

                {/* RIGHT: Toggle + 3-dot */}
                <View style={styles.rightContainer}>
                    {/* Toggle Pill */}
                    <ShimmerPlaceHolder
                        LinearGradient={LinearGradient}
                        style={styles.toggleShimmer}
                        shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
                    />

                    {/* 3-dot */}
                    <ShimmerPlaceHolder
                        LinearGradient={LinearGradient}
                        style={styles.dotShimmer}
                        shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
                    />
                </View>
            </View>

            {/* DIVIDER */}
            <View style={styles.divider} />

            {/* NAME ROW */}
            <View style={styles.nameRow}>
                <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    style={styles.labelShimmer}
                    shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
                />
                <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    style={styles.valueShimmer}
                    shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
                />
            </View>

            {/* ENTRY DATE ROW */}
            <View style={styles.nameRow}>
                <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    style={styles.labelShimmerSmall}
                    shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
                />
                <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    style={styles.valueShimmer}
                    shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
                />
            </View>
        </View>
    );
};

const SourceListShimmer = () => {
    return (
        <FlatList
            data={[...Array(SHIMMER_ITEM_COUNT)]}
            keyExtractor={(_, i) => i.toString()}
            renderItem={() => <ShimmerRow />}
            contentContainerStyle={{ padding: 12 }}
        />
    );
};

export default SourceListShimmer;

const styles = StyleSheet.create({
    rowContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginVertical: 6,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
    },
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 7,
    },
    indexShimmer: {
        width: 20,
        height: 12,
        borderRadius: 4,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    toggleShimmer: {
        width: 36,
        height: 18,
        borderRadius: 9,
    },
    dotShimmer: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    divider: {
        height: 0.5,
        backgroundColor: '#e2e8f0',
        marginVertical: 7,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    labelShimmer: {
        width: 40,
        height: 12,
        borderRadius: 4,
        marginRight: 6,
    },
    labelShimmerSmall: {
        width: 60,
        height: 12,
        borderRadius: 4,
        marginRight: 6,
    },
    valueShimmer: {
        flex: 1,
        height: 12,
        borderRadius: 4,
    },
});