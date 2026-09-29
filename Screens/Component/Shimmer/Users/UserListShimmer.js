import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const UserListShimmer = () => {
    return (
        <View>
            {/* ================= FILTER CHIPS SHIMMER (search ke niche) ================= */}
            <View style={styles.chipsRow}>
                {[1, 2, 3, 4, 5].map((item) => (
                    <ShimmerPlaceholder
                        key={item}
                        LinearGradient={LinearGradient}
                        style={[
                            styles.chip,
                            { width: item === 1 ? 60 : 90 },
                        ]}
                    />
                ))}
            </View>

            <View style={{ paddingHorizontal: 12, paddingTop: 6 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                    <View key={item} style={styles.card}>

                        {/* STATUS BADGE */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.status}
                        />

                        {/* RIGHT ARROW */}
                        <View style={styles.arrowWrapper}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.arrow}
                            />
                        </View>

                        {/* INDEX */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.smallText}
                        />

                        {/* NAME + TYPE BADGE */}
                        <View style={styles.nameRow}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.nameText}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.typeBadge}
                            />
                        </View>

                        {/* MOBILE */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.text}
                        />

                        {/* EMAIL */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.text}
                        />

                        {/* DATE */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.text}
                        />

                    </View>
                ))}
            </View>
        </View>
    );
};

export default UserListShimmer;

const styles = StyleSheet.create({
    chipsRow: {
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    chip: {
        height: 28,
        borderRadius: 20,
        marginRight: 8,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 6,
        marginVertical: 7,
        padding: 14,
        borderWidth: 1,
        borderColor: '#ddd',
        position: 'relative'
    },

    status: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 60,
        height: 16,
        borderBottomLeftRadius: 6,
        borderTopRightRadius: 6,
    },

    /* 🔥 NEW ARROW */
    arrowWrapper: {
        position: 'absolute',
        right: 5,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        padding: 6,
    },

    arrow: {
        width: 30,
        height: 30,
        borderRadius: 20,
    },

    smallText: {
        width: 40,
        height: 10,
        borderRadius: 4,
        marginBottom: 8,
    },

    /* NAME + TYPE BADGE ROW */
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },

    nameText: {
        width: '55%',
        height: 12,
        borderRadius: 4,
    },

    typeBadge: {
        width: 70,
        height: 16,
        borderRadius: 10,
        marginLeft: 8,
    },

    text: {
        width: '80%',
        height: 12,
        borderRadius: 4,
        marginTop: 8,
    },
});