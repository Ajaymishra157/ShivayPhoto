import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const Taskdetailshimmer = () => {
    return (
        <View style={{ padding: 14 }}>

            <View style={styles.card}>

                {/* TITLE + STATUS ROW */}
                <View style={styles.row}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.title}
                    />

                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.statusBadge}
                    />
                </View>

                {/* DESCRIPTION */}
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.descLine1}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.descLine2}
                />

                <View style={styles.divider} />

                {/* INFO ROWS - assigned to, due date, entry on, priority, status */}
                {[1, 2, 3, 4, 5].map((item) => (
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

export default Taskdetailshimmer;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    title: {
        width: '55%',
        height: 16,
        borderRadius: 4,
    },

    statusBadge: {
        width: 80,
        height: 22,
        borderRadius: 20,
    },

    descLine1: {
        width: '90%',
        height: 12,
        borderRadius: 4,
        marginTop: 12,
    },

    descLine2: {
        width: '60%',
        height: 12,
        borderRadius: 4,
        marginTop: 8,
    },

    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },

    icon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        marginRight: 10,
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