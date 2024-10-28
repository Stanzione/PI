import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import axios from 'axios';

const OPENAI_API_KEY = 'Não é uma api';
const SpeechToText: React.FC = () => {
  const [transcription, setTranscription] = useState<string>('');
  const [indicator, setIndicator] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');
  
  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    startListening();

    return () => {
      if (Voice) {
        Voice.destroy().then(() => Voice.removeAllListeners());
      }
    };
  }, []);
  

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      const spokenText = e.value[0].toLowerCase();

      if (spokenText.includes('oi chat')) {
        setIndicator('Reconhecido: Oi tudo bem');
        speak("Estou ouvindo");
        setTranscription('');
        setTimeout(() => startListening(), 3000);
      } else if (spokenText.includes('reproduza')) {
        console.log('Reproduzindo');
        setTranscription(prevTranscription => {
          speak(`${prevTranscription}`);
          return `${prevTranscription}`;
        });
        setTimeout(() => startListening(), 3000);
      } else if (spokenText.includes('envie')) {
        setIndicator('Comando "enviar" recebido. Enviando para o ChatGPT...');
        setIsListening(false);
        Voice.stop();
        setTranscription(prevTranscription => {
          sendToChatGPT(`${prevTranscription}`);
          return '';
        });
        
        
      } else {
        setTranscription(prevTranscription => `${prevTranscription}\n${spokenText}`);
        setIndicator('');
        setTimeout(() => startListening(), 3000);
      }
    } else if (e.value === null) {
      console.log("Fim da entrada de voz.");
      setIsListening(false);
      startListening();
    } else {
      console.warn("Nenhum resultado de fala encontrado.");
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Erro no reconhecimento de fala:', e.error);
    if (e.error?.code === '7') {
      console.log('Erro: Nenhuma correspondência encontrada. Continuando a escuta.');
    }
    setIsListening(false);
    startListening();
  };

  const startListening = async () => {
    try {
      if (!isListening) {
        console.log('Iniciando reconhecimento de fala para o idioma pt-BR');
        setIsListening(true);
        await Voice.start('pt-BR');
      }
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento de fala:', error);
    }
  };
  
  const speak = (text: string) => {
    Speech.speak(text, {
      language: 'pt-BR',
    });
  };

  const sendToChatGPT = async (text: string) => {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: text }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );
      const chatResponse = response.data.choices[0].message.content;
      setResponse(chatResponse);
      speak(chatResponse); // Fala a resposta do ChatGPT
    } catch (error) {
      console.error('Erro ao enviar mensagem para o ChatGPT:', error);
      setResponse('Erro ao obter resposta do ChatGPT.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.indicator}>
        {indicator}
      </Text>
      <Text style={styles.transcription}>
        {transcription ? transcription : 'Fale algo...'}
      </Text>
      <TextInput
        style={styles.responseBox}
        multiline
        editable={false}
        value={response}
        placeholder="A resposta do ChatGPT aparecerá aqui..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  indicator: {
    fontSize: 18,
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  transcription: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  responseBox: {
    marginTop: 20,
    width: '100%',
    height: 200,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    textAlignVertical: 'top',
  },
});

export default SpeechToText;








