import { Button, FormControl, FormLabel, Input, Text, useToast, VStack, Textarea, NumberInput, NumberInputField} from '@chakra-ui/react';
import {
    useCurrentAccount,
    useSignTransactionBlock,
    useSuiClient,
    useSuiClientContext,
  } from '@mysten/dapp-kit';
  import { TransactionBlock } from '@mysten/sui.js/transactions';
  import { normalizeSuiAddress, SUI_TYPE_ARG } from '@mysten/sui.js/utils';
  import { useState } from 'react';
  import { useForm } from 'react-hook-form';
  import { useWeb3 } from '@/hooks/use-web3';

  import { getBytecode } from '../lib/move-template/coin';
  import initMoveByteCodeTemplate from '../lib/move-template/move-bytecode-template';
  import { parseInputEventToNumberString, showTXSuccessToast } from '@/utils';
  import { throwTXIfNotSuccessful } from '@/utils';
  
  const CreateTokenForm = () => {
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const {
      register,
      handleSubmit,
      getValues,
      setValue,
      formState: { errors },
    } = useForm({
      defaultValues: {
        fixedSupply: true,
      },
      mode: 'onBlur',
      reValidateMode: 'onBlur',
    });
  
    const suiClient = useSuiClient();
    const { network } = useSuiClientContext();
    const currentAccount = useCurrentAccount();
    const signTransactionBlock = useSignTransactionBlock();
    const { coinsMap } = useWeb3();

  
    const createToken = async () => {
      setLoading(true);
      if (!currentAccount) {
        setLoading(false);
        return;
      }
  
      const { name, symbol, description, imageUrl, decimals, totalSupply } = getValues();
      await initMoveByteCodeTemplate('/move_bytecode_template_bg.wasm');
  
      const txb = new TransactionBlock();
      // Assume coinsMap is available somehow, e.g. from context
      
      txb.setGasPayment(
        coinsMap[SUI_TYPE_ARG].objects.map(
          ({ coinObjectId, digest, version }) => ({
            objectId: coinObjectId,
            digest: digest,
            version: version,
          })
        )
      );

      const [upgradeCap] = txb.publish({
        modules: [
          [
            ...getBytecode({
              name,
              symbol,
              description,
              imageUrl,
              decimals,
              totalSupply,
              recipient: currentAccount.address,
            }),
          ],
        ],
        dependencies: [normalizeSuiAddress('0x1'), normalizeSuiAddress('0x2')],
      });
  
      txb.transferObjects([upgradeCap], txb.pure(currentAccount.address));
  
      const { signature, transactionBlockBytes } = await signTransactionBlock.mutateAsync({
        transactionBlock: txb,
        account: currentAccount,
      });
  
      const tx = await suiClient.executeTransactionBlock({
        signature,
        transactionBlock: transactionBlockBytes,
        requestType: 'WaitForEffectsCert',
      });
  
      throwTXIfNotSuccessful(tx);
      showTXSuccessToast(tx, network);
      setLoading(false);
    };
  
    const onSubmit = async () => {
      const loadingToastId = toast({
        title: 'Generating new coin...',
        status: 'info',
        duration: null,
        isClosable: false,
      });
  
      try {
        await createToken();
        toast.update(loadingToastId, { title: 'Coin Generated!', status: 'success', duration: 5000, isClosable: true });
      } catch (e) {
        toast.update(loadingToastId, { title: e.message || 'Something went wrong', status: 'error', duration: 5000, isClosable: true });
      } finally {
        toast.close(loadingToastId);
      }
    };
  
    return (
      <VStack as="form" onSubmit={handleSubmit(onSubmit)} align="stretch" p="4" bg="gray.100" borderRadius="md">
        <Text fontSize="2xl" p="4">Coin Generator</Text>
        <FormControl isInvalid={errors.name}>
          <FormLabel>Name</FormLabel>
          <Input placeholder="E.g., Sui" {...register('name')} />
          <Text color="red.500">{errors.name?.message}</Text>
        </FormControl>
        <FormControl isInvalid={errors.symbol}>
          <FormLabel>Coin Symbol</FormLabel>
          <Input placeholder="E.g., SUI" {...register('symbol')} />
          <Text color="red.500">{errors.symbol?.message}</Text>
        </FormControl>
        <FormControl isInvalid={errors.description}>
          <FormLabel>Description</FormLabel>
          <Textarea placeholder="Describe your coin" {...register('description')} />
          <Text color="red.500">{errors.description?.message}</Text>
        </FormControl>
        <FormControl isInvalid={errors.imageUrl}>
          <FormLabel>Coin Image URL</FormLabel>
          <Input placeholder="https://example.com/image.png" {...register('imageUrl')} />
          <Text color="red.500">{errors.imageUrl?.message}</Text>
        </FormControl>
        <FormControl isInvalid={errors.decimals}>
          <FormLabel>Decimals</FormLabel>
          <NumberInput defaultValue={9}>
            <NumberInputField {...register('decimals')} />
          </NumberInput>
          <Text color="red.500">{errors.decimals?.message}</Text>
        </FormControl>
        <FormControl isInvalid={errors.totalSupply}>
          <FormLabel>Total Supply</FormLabel>
          <NumberInput min={0} onChange={(valueString) => setValue('totalSupply', parseInputEventToNumberString({ target: { value: valueString } }))}
            defaultValue={0}>
            <NumberInputField {...register('totalSupply')} />
          </NumberInput>
          <Text color="red.500">{errors.totalSupply?.message}</Text>
        </FormControl>
        <Button isLoading={loading} type="submit" colorScheme="blue">Create Coin</Button>
      </VStack>
    );
  };
  
  export default CreateTokenForm;
  