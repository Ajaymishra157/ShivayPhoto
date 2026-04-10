import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const Followupshimmer = () => {
    return (
        <View style={styles.container}>
            {[1, 2, 3, 4, 5].map((item) => (
                <View key={item} style={styles.leadItem}>

                    {/* Avatar */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.avatar}
                    />

                    {/* Lead Info */}
                    <View style={styles.leadInfo}>
                        {/* Name & Phone */}
                        <View style={styles.nameRow}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.nameShimmer}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.phoneShimmer}
                            />
                        </View>

                        {/* Notes */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.noteShimmer}
                        />

                        {/* Staff */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.staffShimmer}
                        />
                    </View>

                    {/* Eye Icon */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.eyeShimmer}
                    />

                    {/* Meta Section */}
                    <View style={styles.metaContainer}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.statusShimmer}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.dateShimmer}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.timeShimmer}
                        />
                    </View>
                </View>
            ))}
        </View>
    );
};

export default Followupshimmer;

const styles = StyleSheet.create({
    container: {
        paddingVertical: 5,
        backgroundColor: '#FFFFFF',
    },

    leadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F1F5F9',
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },

    leadInfo: {
        flex: 1,
        minWidth: 0,
    },

    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },

    nameShimmer: {
        width: 90,
        height: 12,
        borderRadius: 4,
    },

    phoneShimmer: {
        width: 80,
        height: 12,
        borderRadius: 4,
        marginLeft: 6,
    },

    noteShimmer: {
        width: '80%',
        height: 10,
        borderRadius: 4,
        marginTop: 6,
    },

    staffShimmer: {
        width: 110,
        height: 10,
        borderRadius: 4,
        marginTop: 6,
    },

    eyeShimmer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginHorizontal: 10,
    },

    metaContainer: {
        alignItems: 'flex-end',
    },

    statusShimmer: {
        width: 70,
        height: 14,
        borderRadius: 6,
        marginBottom: 6,
    },

    dateShimmer: {
        width: 60,
        height: 10,
        borderRadius: 4,
        marginBottom: 4,
    },

    timeShimmer: {
        width: 50,
        height: 10,
        borderRadius: 4,
    },
});