import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const UserListShimmer = () => {
    return (
        <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
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

                    {/* NAME */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.text}
                    />

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
    );
};

export default UserListShimmer;

const styles = StyleSheet.create({
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

    text: {
        width: '80%',
        height: 12,
        borderRadius: 4,
        marginTop: 8,
    },
});