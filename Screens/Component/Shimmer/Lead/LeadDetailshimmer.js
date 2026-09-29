import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const PURPLE = '#7367f0';

const LeadDetailshimmer = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1300,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    const Shimmer = ({ style }) => (
        <View style={[styles.shimmerBox, style]}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    { transform: [{ translateX }] },
                ]}
            >
                <LinearGradient
                    colors={['#e5e7eb', '#f8fafc', '#e5e7eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: '100%', height: '100%' }}
                />
            </Animated.View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <Shimmer style={styles.headerIcon} />
                <Shimmer style={styles.headerTitle} />
                <View style={{ width: 22 }} />
            </View>

            {/* HERO BANNER */}
            <View style={styles.hero}>
                <Shimmer style={styles.avatar} />
                <View style={{ flex: 1 }}>
                    <Shimmer style={styles.heroName} />
                    <Shimmer style={styles.heroMeta} />
                    <Shimmer style={styles.heroMetaSmall} />
                    <Shimmer style={styles.heroBadge} />
                </View>
            </View>

            {/* TAB BAR */}
            <View style={styles.tabBar}>
                <Shimmer style={styles.tabItem} />
                <Shimmer style={styles.tabItem} />
                <Shimmer style={styles.tabItem} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* TIMELINE CARD */}
                <View style={styles.card}>
                    {[...Array(3)].map((_, i) => (
                        <View key={i} style={styles.timelineRow}>
                            <View style={styles.timelineLeft}>
                                <Shimmer style={styles.timelineDot} />
                                {i !== 2 && <View style={styles.timelineLine} />}
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Shimmer style={styles.timelineBadge} />
                                <Shimmer style={styles.timelineText} />
                                <Shimmer style={styles.timelineTextShort} />
                                <Shimmer style={styles.timelineDate} />
                            </View>
                        </View>
                    ))}
                </View>

                {/* ABOUT CARD */}
                <View style={styles.card}>
                    {[...Array(5)].map((_, i) => (
                        <View key={i}>
                            <View style={styles.infoPair}>
                                <Shimmer style={styles.infoItem} />
                                <Shimmer style={styles.infoItem} />
                            </View>
                            {i !== 4 && <View style={styles.rowDivider} />}
                        </View>
                    ))}
                </View>

                {/* CONTACT CARD */}
                <View style={styles.card}>
                    <View style={styles.contactRow}>
                        <Shimmer style={styles.contactIcon} />
                        <View style={{ flex: 1 }}>
                            <Shimmer style={styles.contactLineSm} />
                            <Shimmer style={styles.contactLineLg} />
                        </View>
                        <Shimmer style={styles.actionBtn} />
                        <Shimmer style={styles.actionBtn} />
                    </View>

                    <View style={styles.rowDivider} />

                    <View style={styles.contactRow}>
                        <Shimmer style={styles.contactIcon} />
                        <View style={{ flex: 1 }}>
                            <Shimmer style={styles.contactLineSm} />
                            <Shimmer style={styles.contactLineLg} />
                        </View>
                        <Shimmer style={styles.actionBtn} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default LeadDetailshimmer;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f7fa',
    },

    shimmerBox: {
        backgroundColor: '#e5e7eb',
        overflow: 'hidden',
        borderRadius: 6,
    },

    /* HEADER */
    header: {
        backgroundColor: PURPLE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerIcon: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: '#ffffff33',
    },
    headerTitle: {
        width: 120,
        height: 18,
        borderRadius: 6,
        backgroundColor: '#ffffff33',
    },

    /* HERO */
    hero: {
        backgroundColor: PURPLE,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 20,
        alignItems: 'flex-start',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
        backgroundColor: '#ffffff33',
    },
    heroName: {
        width: '70%',
        height: 18,
        borderRadius: 6,
        marginBottom: 8,
    },
    heroMeta: {
        width: '90%',
        height: 12,
        borderRadius: 6,
        marginBottom: 6,
    },
    heroMetaSmall: {
        width: '60%',
        height: 12,
        borderRadius: 6,
        marginBottom: 6,
    },
    heroBadge: {
        width: 120,
        height: 18,
        borderRadius: 20,
        marginTop: 6,
    },

    /* TAB BAR */
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        justifyContent: 'space-around',
        paddingVertical: 12,
    },
    tabItem: {
        width: 70,
        height: 12,
        borderRadius: 6,
    },

    /* CARD */
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 14,
        marginTop: 14,
        padding: 16,
        borderRadius: 14,
        elevation: 3,
    },

    /* TIMELINE */
    timelineRow: {
        flexDirection: 'row',
        marginBottom: 18,
    },
    timelineLeft: {
        width: 22,
        alignItems: 'center',
    },
    timelineDot: {
        width: 11,
        height: 11,
        borderRadius: 6,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#e2d9f8',
        marginTop: 2,
    },
    timelineBadge: {
        width: 120,
        height: 14,
        borderRadius: 10,
        marginBottom: 8,
    },
    timelineText: {
        width: '90%',
        height: 12,
        borderRadius: 6,
        marginBottom: 6,
    },
    timelineTextShort: {
        width: '60%',
        height: 12,
        borderRadius: 6,
        marginBottom: 6,
    },
    timelineDate: {
        width: 100,
        height: 10,
        borderRadius: 6,
        marginTop: 4,
    },

    /* ABOUT GRID */
    infoPair: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    infoItem: {
        width: '48%',
        height: 40,
        borderRadius: 6,
    },
    rowDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 8,
    },

    /* CONTACT */
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    contactIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
    },
    contactLineSm: {
        width: '40%',
        height: 10,
        borderRadius: 6,
        marginBottom: 6,
    },
    contactLineLg: {
        width: '70%',
        height: 12,
        borderRadius: 6,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginLeft: 8,
    },
});