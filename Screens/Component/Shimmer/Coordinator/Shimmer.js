import React from 'react';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

/*
=========================================================
Shimmer
=========================================================
Project ke existing shimmer style (jaisa UserListShimmer.js
mein hai) ke saath consistent — react-native-shimmer-placeholder
+ react-native-linear-gradient use karta hai, gradient-sweep
animation.

Usage:
<Shimmer width={120} height={12} />
<Shimmer width="60%" height={14} borderRadius={4} />
=========================================================
*/

const Shimmer = ({ width = '100%', height = 12, borderRadius = 6, style }) => {

    return (
        <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={[
                {
                    width,
                    height,
                    borderRadius,
                },
                style,
            ]}
        />
    );
};

export default Shimmer;