import React from 'react';
import {
    View, Text, Modal, TouchableOpacity, ScrollView,
    FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API } from './Commoncomponent/Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Followupshimmer from './Shimmer/Followupshimmer';

// const TODAY_LEADS = Array.from({ length: 15 }, (_, i) => {
//     const colorPalette = [
//         { bg: '#fce7f3', text: '#9d174d' },
//         { bg: '#fef3c7', text: '#92400e' },
//         { bg: '#d1fae5', text: '#065f46' },
//         { bg: '#ede9fe', text: '#4c1d95' },
//         { bg: '#dbeafe', text: '#1e3a8a' },
//     ];
//     return {
//         id: i.toString(),
//         initials: ['NL', 'S', 'RL', 'DR', 'AK', 'PM', 'RJ', 'VP', 'GM', 'SP', 'KM', 'TK', 'NB', 'AS', 'MR'][i % 15],
//         avatarBg: colorPalette[i % colorPalette.length].bg,
//         avatarText: colorPalette[i % colorPalette.length].text,
//         name: `Customer ${i + 1}`,
//         phone: `p:98${i}4459687`,
//         notes: i % 3 === 0 ? 'call not rec' : (i % 3 === 1 ? 'MSG SENT' : 'interested'),
//         sales_person_name: i % 2 === 0 ? 'Mayuri Suryavanshi' : 'Rahul Sharma',
//         status: 'Follow-up',
//         date: '08 Apr 2026',
//         time: i % 4 === 0 ? '12:08 PM' : (i % 4 === 1 ? '11:33 AM' : '03:24 AM'),
//     };
// });


const NotificationModal = ({ visible, onClose }) => {
    const [todayLeads, setTodayLeads] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const navigation = useNavigation();

    // ── Same avatar helpers as Followups ──────────────────────
    const avatarColors = [
        { bg: '#fce7f3', text: '#9d174d' },
        { bg: '#fef3c7', text: '#92400e' },
        { bg: '#d1fae5', text: '#065f46' },
        { bg: '#ede9fe', text: '#4c1d95' },
        { bg: '#dbeafe', text: '#1e3a8a' },
        { bg: '#fee2e2', text: '#7f1d1d' },
    ];

    const getAvatarColor = (id) => avatarColors[(id || 0) % avatarColors.length];


    const getInitials = (name) => {
        if (!name) return 'NA';
        const words = name.split(' ');
        return words.length > 1
            ? words[0][0] + words[1][0]
            : words[0][0];
    };


    const fetchTodayLeads = async () => {
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.followup_api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin: userId,
                    tab: 'today'
                })
            });

            const result = await res.json();
            console.log("result ye hai", result);

            if (result.code == 200) {
                setTodayLeads(result.payload || []);
            } else {
                setTodayLeads([]);
            }
        } catch (e) {
            console.log('Followup API error:', e);
            setTodayLeads([]);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (visible) {
            fetchTodayLeads();
        }
    }, [visible]);
    return (
        <Modal visible={visible} transparent animationType="fade">
            {/* Full screen overlay */}
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}>

                {/* Background tap to close */}
                <TouchableOpacity
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    onPress={onClose}
                    activeOpacity={1}
                />

                {/* Positioned near top-right (below bell icon) */}
                <View style={{
                    position: 'absolute',
                    top: 100,   // just below header + bell
                    right: 12,
                    width: '92%',
                    maxHeight: '65%',

                }}>
                    {/* 🔺 Arrow pointing up toward bell */}
                    <View style={{
                        alignSelf: 'flex-end',
                        marginRight: 10,
                        width: 0,
                        height: 0,
                        borderLeftWidth: 10,
                        borderRightWidth: 10,
                        borderBottomWidth: 16,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderBottomColor: '#fff',
                    }} />

                    {/* Modal Box */}
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        overflow: 'hidden',
                        elevation: 8,
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 4 },
                    }}>
                        {/* Header Row */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingTop: 14,
                            paddingBottom: 10,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Icon name="bell-outline" size={18} color="#7367f0" />
                                <Text style={{
                                    fontSize: 16,
                                    fontFamily: 'Inter-Bold',
                                    color: '#0F172A',
                                }}>
                                    Today's Records
                                </Text>
                            </View>

                            {/* Close Button */}
                            <TouchableOpacity onPress={onClose}>
                                <Icon name="close-circle-outline" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Divider */}
                        <View style={{ height: 0.8, backgroundColor: '#E2E8F0' }} />
                        {loading ? (
                            <Followupshimmer />
                        ) : (
                            <FlatList
                                data={todayLeads}
                                keyExtractor={(item) => item.enquiry_id.toString()}
                                showsVerticalScrollIndicator={true}
                                contentContainerStyle={{
                                    paddingBottom: 10,
                                    flexGrow: 1
                                }}

                                ListEmptyComponent={() => (
                                    <View style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        paddingVertical: 40
                                    }}>
                                        <Text style={{
                                            fontSize: 14,
                                            fontFamily: 'Inter-Regular',
                                            color: '#94A3B8'
                                        }}>
                                            No leads found for today
                                        </Text>
                                    </View>
                                )}

                                renderItem={({ item, index }) => {
                                    const parts = item.formatted_time?.split(' ') || [];
                                    const date = parts.slice(0, 3).join(' ');
                                    const time = parts.slice(3).join(' ');
                                    // ✅ Get color based on enquiry_id (same as Followups)
                                    const ac = getAvatarColor(item.enquiry_id);

                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 12,
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                                borderBottomWidth: index === todayLeads.length - 1 ? 0 : 0.5,
                                                borderBottomColor: '#F1F5F9',
                                            }}
                                        >
                                            {/* Avatar */}
                                            <View style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                flexShrink: 0,
                                                backgroundColor: ac.bg,
                                            }}>
                                                <Text style={{
                                                    fontSize: 13,
                                                    fontFamily: 'Inter-Bold',
                                                    color: ac.text,
                                                }}>
                                                    {getInitials(item.name)}
                                                </Text>
                                            </View>

                                            {/* Info Block */}
                                            <View style={{ flex: 1, minWidth: 0 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {/* Name */}
                                                    <Text
                                                        style={{
                                                            fontSize: 13,
                                                            fontFamily: 'Inter-Bold',
                                                            color: 'black',
                                                        }}
                                                    >
                                                        {item.name}
                                                    </Text>

                                                    {/* Mobile Number (Clickable) */}
                                                    {item.mobile ? (
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                onClose(); // Modal close karein
                                                                setTimeout(() => {
                                                                    navigation.navigate('LeadDetail', {
                                                                        enquiry_id: item.enquiry_id,
                                                                    });
                                                                }, 200); // Smooth transition ke liye slight delay
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontFamily: 'Inter-Regular',
                                                                    color: '#7367f0',
                                                                    marginLeft: 6,
                                                                }}
                                                            >
                                                                {item.mobile}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ) : null}
                                                </View>

                                                <Text style={{
                                                    fontSize: 11,
                                                    color: '#64748B',
                                                    fontFamily: 'Inter-Regular',
                                                    marginTop: 2,
                                                }}>
                                                    {item.notes}
                                                </Text>

                                                <Text style={{
                                                    fontSize: 11,
                                                    color: '#94A3B8',
                                                    fontFamily: 'Inter-Regular',
                                                    marginTop: 2,
                                                }}>
                                                    <Icon name="account-outline" size={11} color="#94A3B8" /> {item.sales_person_name}
                                                </Text>
                                            </View>

                                            {/* Right Meta */}
                                            <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                                                <View style={{
                                                    backgroundColor: '#EFF6FF',
                                                    borderRadius: 6,
                                                    paddingHorizontal: 7,
                                                    paddingVertical: 2,
                                                    marginBottom: 4,
                                                }}>
                                                    <Text style={{
                                                        fontSize: 10,
                                                        fontFamily: 'Inter-Bold',
                                                        color: '#1D4ED8',
                                                    }}>
                                                        {item.status}
                                                    </Text>
                                                </View>

                                                <Text style={{
                                                    fontSize: 11,
                                                    fontFamily: 'Inter-Bold',
                                                    color: '#DC2626',
                                                }}>
                                                    {date}
                                                </Text>

                                                {time ? (
                                                    <Text style={{
                                                        fontSize: 10,
                                                        fontFamily: 'Inter-Regular',
                                                        color: '#DC2626',
                                                        marginTop: 1,
                                                    }}>
                                                        {time}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </View>
                                    );
                                }}
                            />
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default NotificationModal;