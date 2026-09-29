import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const Tasklistshimmer = () => {
    return (
        <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
            {[1, 2, 3, 4, 5].map((item) => (
                <View key={item} style={styles.card}>

                    {/* STATUS BADGE TOP RIGHT */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.status}
                    />

                    {/* PRIORITY ROW */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.priorityText}
                    />

                    {/* TITLE */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.title}
                    />

                    {/* DESCRIPTION */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.desc}
                    />

                    <View style={styles.divider} />

                    {/* FOOTER ROW - ASSIGNED + DUE DATE */}
                    <View style={styles.footerRow}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.footerText}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.footerText}
                        />
                    </View>

                    {/* ENTRY ON ROW */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.entryText}
                    />

                </View>
            ))}
        </View>
    );
};

export default Tasklistshimmer;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginVertical: 7,
        borderWidth: 1,
        borderColor: '#eee',
        position: 'relative',
    },

    status: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 70,
        height: 18,
        borderBottomLeftRadius: 8,
        borderTopRightRadius: 10,
    },

    priorityText: {
        width: 100,
        height: 10,
        borderRadius: 4,
        marginTop: 4,
    },

    title: {
        width: '70%',
        height: 14,
        borderRadius: 4,
        marginTop: 10,
    },

    desc: {
        width: '90%',
        height: 11,
        borderRadius: 4,
        marginTop: 8,
    },

    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 10,
    },

    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    footerText: {
        width: '35%',
        height: 11,
        borderRadius: 4,
    },

    entryText: {
        width: '45%',
        height: 11,
        borderRadius: 4,
        marginTop: 10,
    },
});