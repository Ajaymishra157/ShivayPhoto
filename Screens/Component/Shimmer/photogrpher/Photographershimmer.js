import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const S = (props) => <ShimmerPlaceholder LinearGradient={LinearGradient} {...props} />;

// showPayment=false => Coordinator ke liye payment row hide
const Photographershimmer = ({ count = 6, showPayment = true }) => {
    return (
        <View style={styles.container}>
            <View style={styles.listContainer}>
                {[...Array(count)].map((_, index) => (
                    <View key={index} style={styles.card}>

                        {/* TOP ROW */}
                        <View style={styles.topRow}>
                            <S style={styles.avatar} />

                            <View style={styles.middleContent}>
                                <View style={styles.nameRow}>
                                    <S style={styles.name} />
                                    <S style={styles.mobile} />
                                </View>
                                <S style={styles.purpose} />
                            </View>

                            <View style={styles.rightContent}>
                                <S style={styles.idBadge} />
                            </View>
                        </View>

                        {/* SHOOTS BLOCK */}
                        <View style={styles.shootsBlock}>
                            {[0, 1].map(i => (
                                <View key={i} style={styles.shootRow}>
                                    <S style={styles.shootIcon} />
                                    <S style={styles.shootDate} />
                                    <S style={styles.shootTime} />
                                    <S style={styles.shootName} />
                                    <S style={styles.shootPhotographer} />
                                    <S style={styles.shootStatus} />
                                </View>
                            ))}
                        </View>

                        {/* PROGRESS */}
                        <View style={styles.progressWrap}>
                            <View style={styles.progressTop}>
                                <S style={styles.progressLabel} />
                                <S style={styles.progressRight} />
                            </View>
                            <S style={styles.progressBar} />
                        </View>

                        {/* PAYMENT ROW — Booking / Paid / Due */}
                        {showPayment && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.paymentRow}>
                                    {[0, 1, 2].map(i => (
                                        <View key={i} style={styles.paymentBlock}>
                                            <S style={styles.paymentLabel} />
                                            <S style={styles.paymentValue} />
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* DIVIDER */}
                        <View style={styles.divider} />

                        {/* PHOTOGRAPHER */}
                        <View style={styles.photographerBlock}>
                            <S style={styles.smallLabel} />
                            <S style={styles.photographerName} />
                        </View>

                        {/* DETAILS ROW */}
                        <View style={styles.detailsRow}>
                            <View style={styles.coordinatorBlock}>
                                <S style={styles.smallLabel} />
                                <S style={styles.coordinator} />
                            </View>

                            <View style={styles.statusBlock}>
                                <S style={styles.statusLabel} />
                                <S style={styles.statusPill} />
                            </View>

                            {showPayment && <S style={styles.paymentPill} />}
                            <S style={styles.detailsPill} />
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

    listContainer: {
        paddingHorizontal: 10,
        paddingTop: 2,
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

    // TOP ROW
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

    // SHOOTS BLOCK
    shootsBlock: {
        marginTop: 8,
        paddingTop: 7,
        borderTopWidth: 0.5,
        borderTopColor: '#eef2f6',
    },
    shootRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    shootIcon: {
        width: 11,
        height: 11,
        borderRadius: 3,
    },
    shootDate: {
        width: 62,
        height: 10,
        borderRadius: 4,
        marginLeft: 4,
    },
    shootTime: {
        width: 70,
        height: 14,
        borderRadius: 8,
        marginLeft: 6,
    },
    shootName: {
        width: 45,
        height: 9,
        borderRadius: 4,
        marginLeft: 6,
    },
    shootPhotographer: {
        width: 55,
        height: 9,
        borderRadius: 4,
        marginLeft: 6,
    },
    shootStatus: {
        width: 42,
        height: 13,
        borderRadius: 8,
        marginLeft: 6,
    },

    // PROGRESS
    progressWrap: {
        marginTop: 6,
        marginBottom: 2,
    },
    progressTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    progressLabel: {
        width: 70,
        height: 9,
        borderRadius: 4,
    },
    progressRight: {
        width: 40,
        height: 8,
        borderRadius: 4,
    },
    progressBar: {
        width: '100%',
        height: 5,
        borderRadius: 3,
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

    // PHOTOGRAPHER
    photographerBlock: {
        marginBottom: 6,
    },
    photographerName: {
        width: 110,
        height: 10,
        borderRadius: 4,
        marginTop: 4,
    },

    // DETAILS
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 1,
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
        width: 30,
        height: 8,
        borderRadius: 4,
        marginBottom: 3,
    },
    statusPill: {
        width: 62,
        height: 22,
        borderRadius: 13,
    },
    paymentPill: {
        width: 62,
        height: 22,
        borderRadius: 13,
        marginLeft: 5,
    },
    detailsPill: {
        width: 58,
        height: 22,
        borderRadius: 13,
        marginLeft: 5,
    },
});