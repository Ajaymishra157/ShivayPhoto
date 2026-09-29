import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const HalfRowShimmer = () => (
    <View style={styles.halfRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.halfIcon}
            />
            <View style={{ flex: 1 }}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.halfLabel}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.halfValue}
                />
            </View>
        </View>
    </View>
);

const SectionCardShimmer = ({ rows = 4, extraFullRows = 0 }) => (
    <View style={styles.sectionCard}>
        {/* Section title */}
        <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={styles.sectionTitle}
        />

        {/* 2-column grid rows */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: rows }).map((_, i) => (
                <HalfRowShimmer key={i} />
            ))}
        </View>

        {/* Full-width rows (address/remark style) */}
        {Array.from({ length: extraFullRows }).map((_, i) => (
            <View key={i} style={styles.fullRow}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.fullIcon}
                />
                <View style={{ flex: 1 }}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.fullLabel}
                    />
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.fullValue}
                    />
                </View>
            </View>
        ))}
    </View>
);

const BookingDetailShimmer = () => {
    return (
        <View style={{ padding: 14 }}>

            {/* ── NAME HEADER CARD ── */}
            <View style={styles.headerCard}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.headerName}
                    />
                </View>
            </View>

            {/* ── CONTACT INFO ── */}
            <SectionCardShimmer rows={4} extraFullRows={2} />

            {/* ── BOOKING INFO ── */}
            <SectionCardShimmer rows={4} extraFullRows={0} />

            {/* ── COORDINATOR CARD ── */}
            <View style={styles.sectionCard}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.sectionTitle}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.coordIcon}
                    />
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.coordValue}
                    />
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.coordAssign}
                    />
                </View>
            </View>

            {/* ── FINANCIAL INFO ── */}
            <SectionCardShimmer rows={3} extraFullRows={0} />

        </View>
    );
};

export default BookingDetailShimmer;

const styles = StyleSheet.create({
    /* ── HEADER CARD ── */
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    headerName: {
        width: '60%',
        height: 16,
        borderRadius: 4,
    },

    /* ── SECTION CARD ── */
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    sectionTitle: {
        width: '35%',
        height: 12,
        borderRadius: 4,
        marginBottom: 12,
    },

    /* ── HALF ROW (2-column grid) ── */
    halfRow: {
        width: '50%',
        paddingRight: 8,
        marginBottom: 14,
    },
    halfIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
    },
    halfLabel: {
        width: '60%',
        height: 9,
        borderRadius: 4,
        marginBottom: 5,
    },
    halfValue: {
        width: '85%',
        height: 11,
        borderRadius: 4,
    },

    /* ── FULL ROW (address/remark) ── */
    fullRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 4,
        paddingBottom: 11,
        borderTopWidth: 0.5,
        borderTopColor: '#f1f5f9',
    },
    fullIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
    },
    fullLabel: {
        width: '30%',
        height: 10,
        borderRadius: 4,
        marginBottom: 6,
    },
    fullValue: {
        width: '75%',
        height: 12,
        borderRadius: 4,
    },

    /* ── COORDINATOR ROW ── */
    coordIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
    },
    coordValue: {
        flex: 1,
        height: 13,
        borderRadius: 4,
    },
    coordAssign: {
        width: 50,
        height: 12,
        borderRadius: 4,
    },
});