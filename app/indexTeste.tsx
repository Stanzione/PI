import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import axios from 'axios';

// Substitua 'YOUR_OPENAI_API_KEY' pela sua chave da API OpenAI
const OPENAI_API_KEY = 'My key';

const SpeechToText: React.FC = () => {
  const [transcription, setTranscription] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isStoringText, setIsStoringText] = useState<boolean>(false);

  useEffect(() => {
    // Solicita permissão para acessar o microfone
    requestMicrophonePermission();

    // Configura os callbacks do reconhecimento de voz
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Inicia o reconhecimento de voz
    startListening();

    // Limpa as configurações quando o componente é desmontado
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Permissão para usar o microfone',
            message: 'Este aplicativo precisa acessar o microfone para funcionar corretamente.',
            buttonNeutral: 'Perguntar depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Permissão de microfone concedida');
        } else {
          console.log('Permissão de microfone negada');
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const onSpeechStart = (e: any) => {
    console.log('Reconhecimento de fala iniciado');
  };

  const onSpeechEnd = (e: any) => {
    console.log('Reconhecimento de fala terminado');
    // Reinicia o reconhecimento após terminar
    startListening();
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      const speechText = e.value[0].toLowerCase();
      console.log(`Fala detectada: ${speechText}`);

      if (speechText.includes('oi jarvis')) {
        console.log('ola');
        setIsStoringText(true);
        //setTranscription(''); // Limpa a transcrição anterior
        //setResponse(''); // Zera a resposta
        Speech.speak('Estou ouvindo', { language: 'pt-BR' });
      } else if (isStoringText && speechText.includes('envie')) {
        fetchChatGPTResponse();
        setIsStoringText(false);
      } else if (speechText.includes('reproduza')) {
        speakText();
      } else if (isStoringText) {
        setTranscription(prev => prev + ' ' + speechText);
      }
    }

    // Continua escutando
    startListening();
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Erro no reconhecimento de fala:', e.error);
    // Tenta reiniciar o reconhecimento
    startListening();
  };

  const startListening = async () => {
    try {
      await Voice.start('pt-BR');
    } catch (error) {
      console.error('Erro ao iniciar o reconhecimento de fala:', error);
    }
  };

  const speakText = () => {
    if (response) {
      Speech.speak(response, { language: 'pt-BR' });
    } else {
      console.warn('Nenhuma resposta para ler.');
    }
  };

  const fetchChatGPTResponse = async () => {
    try {
      setLoading(true);
      const result = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: transcription }],
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const chatGPTResponse = result.data.choices[0]?.message?.content || 'Nenhuma resposta recebida.';
      setResponse(chatGPTResponse);
    } catch (error) {
      console.error('Erro ao buscar resposta do ChatGPT:', error);
      setResponse('Erro ao buscar resposta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.responseContainer}>
          <FlatList
            data={response ? [{ key: response }] : []}
            renderItem={({ item }) => <Text style={styles.responseText}>{item.key}</Text>}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      )}

      <Text style={styles.transcription}>
        {transcription ? transcription : 'Fale algo...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  transcription: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
  },
  responseContainer: {
    marginTop: 20,
    flex: 1,
  },
  responseText: {
    fontSize: 16,
    color: 'black',
  },
});

export default SpeechToText;



