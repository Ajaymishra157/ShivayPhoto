import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

/*
  NOTE: Stage-chips row aur count-text ka shimmer yahan se hata diya hai.
  Wo real tabs already Bookinglist.js me upar (loading ke bahar) render ho rahe
  hain, isliye unka duplicate shimmer dikhana galat lag raha tha.
  Ab ye component sirf list-cards ka shimmer dikhayega.
*/
const ListBookingShimmer = () => {
    return (
        <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
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

                    {/* INDEX + ORDER NO */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.smallText}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={[styles.smallText, { width: 60, marginLeft: 8 }]}
                        />
                    </View>

                    {/* NAME + STAGE BADGE */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={[styles.text, { width: '50%', marginTop: 0 }]}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.stageBadge}
                        />
                    </View>

                    {/* MOBILE */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.text}
                    />

                    {/* ADDRESS */}
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

export default ListBookingShimmer;

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
    },

    stageBadge: {
        width: 90,
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