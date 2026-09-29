import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const Photographershimmer = ({ count = 6 }) => {
    return (
        <View style={styles.container}>

            {/* SEARCH BAR */}
            <View style={styles.searchBar}>
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.searchIcon} />
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.searchText} />
            </View>

            {/* SECTION HEADER */}
            <View style={styles.sectionHeader}>
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.sectionIcon} />
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.sectionTitle} />
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.sectionCount} />
                <View style={{ flex: 1 }} />
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.sectionBadge} />
            </View>

            {/* PHOTOGRAPHER LIST */}
            <View style={styles.listContainer}>
                {[...Array(count)].map((_, index) => (
                    <View key={index} style={styles.card}>

                        {/* TOP ROW */}
                        <View style={styles.topRow}>
                            <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.avatar} />

                            <View style={styles.middleContent}>
                                <View style={styles.nameRow}>
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.name} />
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.mobile} />
                                </View>
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.purpose} />
                            </View>

                            <View style={styles.rightContent}>
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.idBadge} />
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.date} />
                            </View>
                        </View>

                        {/* PAYMENT ROW — Booking / Paid / Due */}
                        <View style={styles.divider} />
                        <View style={styles.paymentRow}>
                            <View style={styles.paymentBlock}>
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.paymentLabel} />
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.paymentValue} />
                            </View>
                            <View style={[styles.paymentBlock, { marginHorizontal: 2.5 }]}>
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.paymentLabel} />
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.paymentValue} />
                            </View>
                            <View style={styles.paymentBlock}>
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.paymentLabel} />
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.paymentValue} />
                            </View>
                        </View>

                        {/* DIVIDER */}
                        <View style={styles.divider} />

                        {/* DETAILS ROW */}
                        <View style={styles.detailsRow}>
                            <View style={styles.coordinatorBlock}>
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.smallLabel} />
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.coordinator} />
                            </View>

                            <View style={styles.statusBlock}>
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.statusLabel} />
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.statusPill} />
                            </View>

                            <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.actionPill} />
                        </View>

                    </View>
                ))}
            </View>

        </View>
    );
};

export default Photographershimmer;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f8',
    },

    // SEARCH
    searchBar: {
        marginHorizontal: 12,
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 11,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        height: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },

    searchIcon: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },

    searchText: {
        width: '72%',
        height: 11,
        borderRadius: 4,
        marginLeft: 10,
    },

    // SECTION HEADER
    sectionHeader: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 7,
        flexDirection: 'row',
        alignItems: 'center',
    },

    sectionIcon: {
        width: 17,
        height: 17,
        borderRadius: 4,
    },

    sectionTitle: {
        width: 105,
        height: 12,
        borderRadius: 4,
        marginLeft: 8,
    },

    sectionCount: {
        width: 28,
        height: 16,
        borderRadius: 15,
        marginLeft: 8,
    },

    sectionBadge: {
        width: 150,
        height: 20,
        borderRadius: 15,
    },

    // LIST
    listContainer: {
        paddingHorizontal: 10,
    },

    // CARD
    card: {
        backgroundColor: '#fff',
        marginBottom: 7,
        borderRadius: 11,
        padding: 9,
        borderLeftWidth: 3,
        borderLeftColor: '#e2e5ea',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    avatar: {
        width: 31,
        height: 31,
        borderRadius: 8,
        marginRight: 7,
    },

    middleContent: {
        flex: 1,
        minWidth: 0,
    },

    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    name: {
        width: 90,
        height: 12,
        borderRadius: 4,
    },

    mobile: {
        width: 50,
        height: 9,
        borderRadius: 4,
        marginLeft: 8,
    },

    purpose: {
        width: 75,
        height: 10,
        borderRadius: 4,
        marginTop: 6,
    },

    rightContent: {
        alignItems: 'flex-end',
        marginLeft: 7,
    },

    idBadge: {
        width: 38,
        height: 14,
        borderRadius: 5,
    },

    date: {
        width: 48,
        height: 9,
        borderRadius: 4,
        marginTop: 5,
    },

    // DIVIDER
    divider: {
        height: 0.5,
        backgroundColor: '#eef2f6',
        marginTop: 8,
        marginBottom: 6,
    },

    // PAYMENT ROW (Booking / Paid / Due)
    paymentRow: {
        flexDirection: 'row',
    },

    paymentBlock: {
        flex: 1,
    },

    paymentLabel: {
        width: 50,
        height: 7,
        borderRadius: 3,
    },

    paymentValue: {
        width: 65,
        height: 11,
        borderRadius: 4,
        marginTop: 4,
    },

    // DETAILS
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },

    coordinatorBlock: {
        flex: 1,
        minWidth: 0,
    },

    smallLabel: {
        width: 55,
        height: 8,
        borderRadius: 4,
    },

    coordinator: {
        width: 85,
        height: 10,
        borderRadius: 4,
        marginTop: 4,
    },

    statusBlock: {
        marginLeft: 7,
        alignItems: 'flex-start',
    },

    statusLabel: {
        width: 35,
        height: 8,
        borderRadius: 4,
        marginBottom: 3,
    },

    statusPill: {
        width: 68,
        height: 22,
        borderRadius: 13,
    },

    actionPill: {
        width: 65,
        height: 22,
        borderRadius: 13,
        marginLeft: 5,
    },
});