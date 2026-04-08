import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Alert
} from 'react-native';
import Pdf from 'react-native-pdf';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import { Colors } from '../Commoncomponent/Constants';

const PdfViewerScreen = ({ route, navigation }) => {
    const { pdfUrl, billNo, name } = route.params;

    const [saving, setSaving] = useState(false);

    // ✅ SAVE PDF
    const savePdfToDevice = async () => {
        try {
            if (saving) return;
            setSaving(true);

            if (!pdfUrl) return;

            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');

            const dateTimeString = `${dd}${mm}${yyyy}${hh}${min}${ss}`;
            const safeName = (name || 'Leads').replace(/\s+/g, '');

            const fileName = `${safeName}_${dateTimeString}.pdf`;

            const destinationPath =
                Platform.OS === 'android'
                    ? `${RNFS.DownloadDirectoryPath}/${fileName}`
                    : `${RNFS.DocumentDirectoryPath}/${fileName}`;

            // 👇 copy file
            await RNFS.copyFile(pdfUrl, destinationPath);

            if (Platform.OS === 'android') {
                await RNFS.scanFile(destinationPath);

                Toast.show({
                    type: 'success',
                    text1: 'PDF Saved',
                    text2: `${fileName} saved to Downloads`,
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
            } else {
                Alert.alert('Saved', `PDF saved at ${destinationPath}`);
            }

        } catch (e) {
            console.log(e);
            Alert.alert('Error', 'Failed to save PDF');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>PDF Viewer</Text>
            </View>

            {/* PDF VIEW */}
            <Pdf
                source={{ uri: pdfUrl, cache: true }}
                style={styles.pdf}
                onError={(error) => {
                    console.log('PDF load error:', error);
                }}
            />

            {/* BOTTOM BAR */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    disabled={saving}
                    onPress={savePdfToDevice}
                    style={[styles.saveBtn, { backgroundColor: saving ? '#94A3B8' : '#2563EB' }]}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Feather name="download" size={18} color="#fff" />
                            <Text style={styles.btnText}>Save PDF</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

        </View>
    );
};

export default PdfViewerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.buttonbgcolor,
    },
    header: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.buttonbgcolor,
        elevation: 4,
    },
    backBtn: {
        position: 'absolute',
        left: 15,
        top: 18,
    },
    headerTitle: {
        fontSize: 18,
        color: 'black',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        backgroundColor: '#fff',
    },
    bottomBar: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#fff',
    },
    saveBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 10,
    },
    btnText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 14,
    },
});