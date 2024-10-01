import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import axios from 'axios';

// Substitua 'YOUR_OPENAI_API_KEY' pela sua chave da API OpenAI
const OPENAI_API_KEY = "my key";

const SpeechToText: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // Estado de carregamento

  useEffect(() => {
    // Configura o callback para quando resultados de fala são recebidos
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Limpa as configurações quando o componente é desmontado
    return () => {
      if (Voice) {
        Voice.destroy().then(() => Voice.removeAllListeners());
      }
    };
  }, []);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      setTranscription(e.value[0]); // Atualiza a transcrição com o primeiro resultado
    } else {
      console.warn("Nenhum resultado de fala encontrado.");
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Erro no reconhecimento de fala:', e.error);
    console.log('Detalhes do erro:', e);
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      console.log('Iniciando reconhecimento de fala para o idioma pt-BR');
      await Voice.start('pt-BR'); // Defina o idioma desejado
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento de fala:', error);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      if (Voice) {
        await Voice.stop();
      }
    } catch (error) {
      console.error('Erro ao parar reconhecimento de fala:', error);
    }
  };

  const speakText = () => {
    if (response) {
      Speech.speak(response, {
        language: 'pt-BR', // Defina o idioma conforme necessário
      });
    } else {
      console.warn("Nenhuma resposta para ler.");
    }
  };

  const fetchChatGPTResponse = async () => {
    try {
      setLoading(true); // Ativa o indicador de carregamento
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo', // Ajustado o modelo correto
          messages: [{ role: 'user', content: transcription }],
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`, // Corrigido uso de template string
            'Content-Type': 'application/json',
          },
        }
      );
      const chatGPTResponse = response.data.choices[0]?.message?.content || 'Nenhuma resposta recebida.';
      setResponse(chatGPTResponse);
    } catch (error) {
      console.error('Erro ao buscar resposta do ChatGPT:', error);
      setResponse('Erro ao buscar resposta.');
    } finally {
      setLoading(false); // Desativa o indicador de carregamento
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button
          title={isListening ? "Parar de ouvir" : "Ouvir"}
          onPress={isListening ? stopListening : startListening}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Ler Resposta"
          onPress={speakText}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Consultar ChatGPT"
          onPress={fetchChatGPTResponse}
        />
      </View>

      {/* Exibe o indicador de carregamento enquanto a resposta está sendo carregada */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.responseContainer}>
          {/* Exibe a resposta em uma FlatList para permitir rolagem */}
          <FlatList
            data={response ? [{ key: response }] : []} // Passa a resposta como uma lista com um único item
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  transcription: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
  },
  responseContainer: {
    marginTop: 20,
    width: '100%',
    height: 200,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
  },
  responseText: {
    fontSize: 16,
    color: 'black',
  },
});

export default SpeechToText;

