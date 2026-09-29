import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Fonts } from '../Commoncomponent/Constants';

const PRIORITY_COLORS = {
    High: '#DC2626',
    Medium: '#F59E0B',
    Low: '#16A34A',
};

const STATUS_COLORS = {
    'In Progress': '#2563EB',
    Pending: '#EAB308',
    Review: '#06B6D4',
    Done: '#16A34A',
    Delivered: '#16A34A',
};

const PostProductionDetail = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const item = route?.params?.jobData || {};

    const isCompleted = !!item.completed;
    const statusColor = STATUS_COLORS[item.status] || '#64748b';

    /* ─────────────────────────────────────────────
       SECTION CARD WRAPPER
       ───────────────────────────────────────────── */

    const SectionCard = ({ children, style }) => (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                elevation: 1,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 3,
                shadowOffset: {
                    width: 0,
                    height: 1,
                },
                ...style,
            }}
        >
            {children}
        </View>
    );

    const SectionTitle = ({ icon, title }) => (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
            }}
        >
            <Icon
                name={icon}
                size={15}
                color="#0F172A"
            />

            <Text
                style={{
                    fontSize: 12.5,
                    fontFamily: Fonts.Bold,
                    color: '#1e293b',
                    marginLeft: 6,
                }}
            >
                {title}
            </Text>
        </View>
    );

    const InfoRow = ({ icon, label, value, valueColor }) => (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
            }}
        >
            <View
                style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: '#f1f5f9',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 9,
                }}
            >
                <Icon
                    name={icon}
                    size={14}
                    color="#64748b"
                />
            </View>

            <View
                style={{
                    flex: 1,
                }}
            >
                <Text
                    style={{
                        fontSize: 9,
                        fontFamily: Fonts.Regular,
                        color: '#94a3b8',
                    }}
                >
                    {label}
                </Text>

                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 12,
                        fontFamily: Fonts.Bold,
                        color: valueColor || '#1e293b',
                        marginTop: 1,
                    }}
                >
                    {value || '-'}
                </Text>
            </View>
        </View>
    );

    /* ─────────────────────────────────────────────
       SCREEN
       ───────────────────────────────────────────── */

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#f5f6f8',
            }}
        >
            <StatusBar
                backgroundColor={Colors.buttonbgcolor}
                barStyle="light-content"
            />

            {/* HEADER */}
            <View
                style={{
                    height: 50,
                    backgroundColor: Colors.buttonbgcolor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                >
                    <Icon
                        name="arrow-left"
                        size={24}
                        color="#fff"
                    />
                </TouchableOpacity>

                <Text
                    style={{
                        color: '#fff',
                        fontSize: 16,
                        fontFamily: Fonts.Bold,
                    }}
                >
                    Job Details
                </Text>

                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    padding: 12,
                    paddingBottom: 35,
                }}
            >
                {/* JOB SUMMARY CARD */}
                <SectionCard>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: '#0f172a',
                                borderRadius: 6,
                                paddingHorizontal: 9,
                                paddingVertical: 4,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 10.5,
                                    fontFamily: Fonts.Bold,
                                    color: '#fff',
                                }}
                            >
                                {item.jobNo}
                            </Text>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: statusColor,
                                borderRadius: 15,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                            }}
                        >
                            {isCompleted && (
                                <Icon
                                    name="check"
                                    size={11}
                                    color="#fff"
                                    style={{ marginRight: 3 }}
                                />
                            )}
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontFamily: Fonts.Bold,
                                    color: '#fff',
                                }}
                            >
                                {item.status}
                            </Text>
                        </View>
                    </View>

                    <Text
                        style={{
                            fontSize: 18,
                            fontFamily: Fonts.Bold,
                            color: '#1e293b',
                            marginTop: 12,
                        }}
                    >
                        {item.client}
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 5,
                        }}
                    >
                        <Icon
                            name="tag-outline"
                            size={12}
                            color="#94a3b8"
                        />
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: Fonts.Regular,
                                color: '#64748b',
                                marginLeft: 4,
                            }}
                        >
                            {item.purpose}
                        </Text>

                        <Icon
                            name="bookmark-outline"
                            size={12}
                            color="#94a3b8"
                            style={{ marginLeft: 12 }}
                        />
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: Fonts.Regular,
                                color: '#64748b',
                                marginLeft: 4,
                            }}
                        >
                            #{item.booking}
                        </Text>
                    </View>

                    {!!item.priority && (
                        <View
                            style={{
                                alignSelf: 'flex-start',
                                backgroundColor:
                                    (PRIORITY_COLORS[item.priority] ||
                                        '#64748b') + '20',
                                borderRadius: 15,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                marginTop: 10,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 9.5,
                                    fontFamily: Fonts.Bold,
                                    color:
                                        PRIORITY_COLORS[item.priority] ||
                                        '#64748b',
                                }}
                            >
                                {item.priority} Priority
                            </Text>
                        </View>
                    )}
                </SectionCard>

                {/* PROGRESS CARD - only for active/in-progress jobs */}
                {!!item.progress && (
                    <SectionCard>
                        <SectionTitle
                            icon="chart-donut"
                            title="Progress"
                        />

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginBottom: 6,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontFamily: Fonts.Regular,
                                    color: '#94a3b8',
                                }}
                            >
                                Completion
                            </Text>

                            <Text
                                style={{
                                    fontSize: 12,
                                    fontFamily: Fonts.Bold,
                                    color: '#2563EB',
                                }}
                            >
                                {item.progress}
                            </Text>
                        </View>

                        <View
                            style={{
                                height: 7,
                                borderRadius: 4,
                                backgroundColor: '#e2e8f0',
                                overflow: 'hidden',
                            }}
                        >
                            <View
                                style={{
                                    height: 7,
                                    width: item.progress,
                                    borderRadius: 4,
                                    backgroundColor: '#2563EB',
                                }}
                            />
                        </View>
                    </SectionCard>
                )}

                {/* TEAM CARD */}
                <SectionCard>
                    <SectionTitle
                        icon="account-group-outline"
                        title="Team Assigned"
                    />

                    <InfoRow
                        icon="camera-outline"
                        label="Photographer"
                        value={item.photographer}
                    />

                    <InfoRow
                        icon="image-edit-outline"
                        label="Editor"
                        value={item.editor}
                    />
                </SectionCard>

                {/* TIMELINE CARD */}
                <SectionCard>
                    <SectionTitle
                        icon="calendar-clock-outline"
                        title="Timeline"
                    />

                    {isCompleted ? (
                        <InfoRow
                            icon="calendar-check-outline"
                            label="Completed On"
                            value={item.completed}
                            valueColor="#16A34A"
                        />
                    ) : (
                        <InfoRow
                            icon="truck-delivery-outline"
                            label="Delivery Date"
                            value={item.delivery}
                        />
                    )}
                </SectionCard>

                {/* ACTION BUTTONS */}
                {!isCompleted && (
                    <View
                        style={{
                            flexDirection: 'row',
                            marginTop: 4,
                        }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={{
                                flex: 1,
                                backgroundColor: '#fff',
                                borderWidth: 1,
                                borderColor: '#e2e8f0',
                                borderRadius: 10,
                                paddingVertical: 12,
                                alignItems: 'center',
                                marginRight: 8,
                                flexDirection: 'row',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon
                                name="message-text-outline"
                                size={15}
                                color="#334155"
                            />
                            <Text
                                style={{
                                    fontSize: 11.5,
                                    fontFamily: Fonts.Bold,
                                    color: '#334155',
                                    marginLeft: 6,
                                }}
                            >
                                Message Team
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={{
                                flex: 1,
                                backgroundColor: Colors.buttonbgcolor,
                                borderRadius: 10,
                                paddingVertical: 12,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon
                                name="check-circle-outline"
                                size={15}
                                color="#fff"
                            />
                            <Text
                                style={{
                                    fontSize: 11.5,
                                    fontFamily: Fonts.Bold,
                                    color: '#fff',
                                    marginLeft: 6,
                                }}
                            >
                                Mark Complete
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default PostProductionDetail;