import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import axios from 'axios';
const OPENAI_API_KEY = 'My key';
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
        setTranscription(''); // Zera a caixa de texto
        
        setTimeout(() => startListening(), 3000); // Recomeça a escutar depois de sintetizar a fala
      } else if (spokenText.includes('reproduza')) {
        console.log('Reproduzindo');
        setTranscription(prevTranscription => {
          speak(`${prevTranscription}`);
          // Verifica se o texto anterior está correto
          return `${prevTranscription}`;
        });
        setTimeout(() => startListening(), 3000);
      } else if (spokenText.includes('enviar')) {
        setIndicator('Comando "enviar" recebido. Encerrando reconhecimento.');
        setIsListening(false);
        setTranscription('');
        Voice.stop();
      } else {
        // Acumula o texto de fala na transcrição sem resetar
        setTranscription(prevTranscription => {
          // Verifica se o texto anterior está correto
          console.log('Transcrição anterior:', prevTranscription);
          return `${prevTranscription}\n${spokenText}`;
        });
        setIndicator('');
        setTimeout(() => startListening(), 3000); // Continua escutando logo após a transcrição
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
        value={transcription}
        placeholder="O que você disse aparecerá aqui..."
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








