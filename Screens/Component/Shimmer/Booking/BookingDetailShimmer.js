import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const BookingDetailShimmer = () => {
    return (
        <View style={{ padding: 14 }}>

            <View style={styles.card}>

                {/* NAME */}
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.name}
                />

                <View style={styles.divider} />

                {/* INFO ROWS (more rows for booking) */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                    <View key={item} style={styles.infoRow}>

                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.icon}
                        />

                        <View style={{ flex: 1 }}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.label}
                            />

                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.value}
                            />
                        </View>

                    </View>
                ))}

            </View>
        </View>
    );
};

export default BookingDetailShimmer;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },

    name: {
        width: '60%',
        height: 18,
        borderRadius: 4,
    },

    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
        gap: 12,
    },

    icon: {
        width: 34,
        height: 34,
        borderRadius: 10,
    },

    label: {
        width: '40%',
        height: 10,
        borderRadius: 4,
        marginBottom: 6,
    },

    value: {
        width: '70%',
        height: 12,
        borderRadius: 4,
    },
});