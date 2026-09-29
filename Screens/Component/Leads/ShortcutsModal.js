import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts } from '../Commoncomponent/Constants';

const ShortcutsModal = ({ visible, onClose, navigation }) => {

    const handleAddLeads = () => {
        onClose();
        navigation.navigate('AddLeads');
    };

    const handlePendingEnquiry = () => {
        onClose();
        // AddLeads screen par jaate waqt Pending status pre-select karke bhejna
        navigation.navigate('AddLeads', {
            preSelectedStatus: { label: 'Pending / Pre Enquiry', value: 'Pending' }
        });
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modal} onStartShouldSetResponder={() => true}>
                    <Text style={styles.heading}>Shortcuts</Text>

                    <TouchableOpacity style={styles.item} onPress={handleAddLeads}>
                        <Icon name="account-plus-outline" size={18} color="#8B5CF6" />
                        <Text style={styles.itemText}>Add Leads</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]} onPress={handlePendingEnquiry}>
                        <Icon name="clock-outline" size={18} color="#F59E0B" />
                        <Text style={styles.itemText}>Pending / Pre Enquiry</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default ShortcutsModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    modal: {
        position: 'absolute',
        top: 100,        // header + banner ke neeche
        right: 80,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        minWidth: 210,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        overflow: 'hidden',
    },
    heading: {
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: Fonts.Bold,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F1F5F9',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F1F5F9',
    },
    itemText: {
        fontSize: 14,
        color: '#1E293B',
        fontFamily: Fonts.Regular,
    },
});