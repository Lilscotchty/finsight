
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadcnFormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Activity, Brain, Clock, Search, Info, Lightbulb, TrendingUp, TrendingDown, ShieldAlert, CircleDot, Target, StopCircle, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Import the main function and the OUTPUT type from the flow. We don't import the schema object.
import { analyzeMarketData, type AnalyzeMarketDataOutput } from "@/ai/flows/analyze-market-data-flow";
import { fetchMarketDataFromAV, type FetchMarketDataResult } from "@/lib/actions"; 
import { Alert, AlertDescription as ShadcnAlertDescription, AlertTitle as ShadcnAlertTitle } from "@/components/ui/alert";
// Import AnalyzeMarketDataInput type from src/types for ensuring our local schema matches
import type { TradingSession, AlphaVantageGlobalQuote, AnalyzeMarketDataInput } from "@/types"; 

// Define the Zod enum for trading sessions locally for form validation
const LocalTradingSessionEnum = z.enum([
  "None/Overlap",
  "Asia",
  "London Open",
  "London Close",
  "New York AM",
  "New York PM"
]).optional();

// Define the Zod schema for form validation locally in this client component
const marketDataFormSchema = z.object({
  symbolToFetch: z.string().optional(), 
  assetSymbol: z.string().min(1, "Asset symbol is required.").describe("The trading symbol, e.g., BTC/USD, AAPL"),
  currentPrice: z.number({ required_error: "Current price is required.", invalid_type_error: "Current price must be a number."}),
  recentHigh: z.number({ required_error: "Recent high is required.", invalid_type_error: "Recent high must be a number."}),
  recentLow: z.number({ required_error: "Recent low is required.", invalid_type_error: "Recent low must be a number."}),
  marketTrendDescription: z.string().min(1, "Market trend description is required."),
  keyLevelsDescription: z.string().optional(),
  activeTradingSession: LocalTradingSessionEnum
});

const tradingSessionsDisplay: NonNullable<TradingSession>[] = [ 
  "None/Overlap",
  "Asia",
  "London Open",
  "London Close",
  "New York AM",
  "New York PM"
];

export function LiveMarketDataDisplay() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeMarketDataOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [isFetchingData, setIsFetchingData] = useState(false);
  const [fetchDataError, setFetchDataError] = useState<string | null>(null);


  const form = useForm<z.infer<typeof marketDataFormSchema>>({
    resolver: zodResolver(marketDataFormSchema),
    defaultValues: {
      symbolToFetch: "AAPL", 
      assetSymbol: "NASDAQ:AAPL",
      currentPrice: 0,
      recentHigh: 0,
      recentLow: 0,
      marketTrendDescription: "Currently in a short-term uptrend, approaching recent highs after a small pullback.",
      keyLevelsDescription: "Potential resistance at recent highs. Bullish order block visible around prior lows.",
      activeTradingSession: "None/Overlap",
    },
  });

  const handleFetchData = async () => {
    const symbol = form.getValues("symbolToFetch");
    if (!symbol) {
      setFetchDataError("Please enter a symbol to fetch.");
      return;
    }
    setIsFetchingData(true);
    setFetchDataError(null);
    try {
      const result: FetchMarketDataResult = await fetchMarketDataFromAV(symbol); 
      if (result.error) {
        setFetchDataError(result.error);
        toast({
          title: "Fetch Failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        const fetchedData = result.data;
        form.setValue("assetSymbol", fetchedData.symbol); 
        form.setValue("currentPrice", fetchedData.price);
        form.setValue("recentHigh", fetchedData.high);
        form.setValue("recentLow", fetchedData.low);
        toast({
          title: "Data Fetched",
          description: `Successfully fetched quote for ${fetchedData.symbol}${result.assetType ? ` (${result.assetType})` : ''}.`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during fetch.";
      setFetchDataError(errorMessage);
      toast({
        title: "Fetch Error",
        description: `Quote service error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsFetchingData(false);
    }
  };


  const onSubmitAnalysis = async (values: z.infer<typeof marketDataFormSchema>) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      // Exclude symbolToFetch before sending to the AI flow
      const { symbolToFetch, ...analysisInputData } = values;
      // Ensure analysisInputData matches the AnalyzeMarketDataInput type expected by the flow
      const result = await analyzeMarketData(analysisInputData as AnalyzeMarketDataInput);
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "Conceptual market analysis has been generated.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setAnalysisError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Activity className="text-accent" />Market Data & Observations</CardTitle>
          <CardDescription>
            Observe the TradingView chart. Optionally, fetch a quote by entering a symbol (e.g., AAPL, EUR/USD, BTCUSD). Then, manually refine data and add your observations for AI-powered conceptual analysis using our data provider.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitAnalysis)}>
            <CardContent className="space-y-6 pt-4">

              <div className="border p-4 rounded-md space-y-4 bg-muted/30">
                <FormField
                  control={form.control}
                  name="symbolToFetch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><Search className="h-4 w-4" /> Symbol for Quote Fetch (Optional)</FormLabel>
                      <div className="flex gap-2 items-center">
                        <FormControl>
                          <Input {...field} placeholder="e.g., AAPL, EUR/USD, BTCUSD" />
                        </FormControl>
                        <Button type="button" onClick={handleFetchData} disabled={isFetchingData} variant="outline" className="shrink-0">
                          {isFetchingData ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Fetching...
                            </>
                          ) : (
                            "Fetch Quote"
                          )}
                        </Button>
                      </div>
                      <ShadcnFormDescription>
                         Enter Stock (e.g. AAPL), Forex (e.g. EUR/USD or EURUSD), or Crypto (e.g. BTC/USD or BTCUSD) symbol. Data from the quote service pre-fills fields below.
                      </ShadcnFormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {fetchDataError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <ShadcnAlertTitle>Data Fetch Error</ShadcnAlertTitle>
                    <ShadcnAlertDescription>
                      {fetchDataError}
                      <br />
                      Ensure the symbol format is correct. The quote service may have limitations or require specific symbol formats. For complex assets or if issues persist, please enter data manually. Also, check your API key for the service and its rate limits.
                    </ShadcnAlertDescription>
                  </Alert>
                )}
              </div>


               <FormField
                control={form.control}
                name="activeTradingSession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><Clock className="h-4 w-4"/>Perceived Trading Session</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "None/Overlap"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select current session (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tradingSessionsDisplay.map(session => (
                          <SelectItem key={session} value={session}>{session}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ShadcnFormDescription>Helps contextualize session-specific patterns.</ShadcnFormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assetSymbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Symbol for Analysis (e.g., NASDAQ:AAPL, BTC/USD, EUR/USD)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter asset symbol observed in chart" />
                    </FormControl>
                    <ShadcnFormDescription>This symbol provides context for the AI. Can be auto-filled or entered manually.</ShadcnFormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="currentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="recentHigh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recent Significant High</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recentLow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recent Significant Low</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="marketTrendDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Market Trend Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 'Strong uptrend after breaking resistance, now consolidating.'" {...field} rows={3} />
                    </FormControl>
                    <ShadcnFormDescription>Describe the trend you observe in the chart.</ShadcnFormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keyLevelsDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Key Levels Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 'Approaching daily order block at 50000. FVG present between 48000-48200.'" {...field} rows={3} />
                    </FormControl>
                     <ShadcnFormDescription>Describe any important S/R, OBs, FVGs you see.</ShadcnFormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isAnalyzing} className="w-full bg-primary hover:bg-primary/90">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Get Conceptual Analysis
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {analysisError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <ShadcnAlertTitle>Analysis Error</ShadcnAlertTitle>
          <ShadcnAlertDescription>{analysisError}</ShadcnAlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <div className="space-y-6">
          {/* Simplified Guidance Section */}
          <Card className="shadow-lg border-accent">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2"><Lightbulb className="text-accent" /> Simplified Conceptual Guidance</CardTitle>
              <CardDescription>This is AI-generated conceptual guidance for educational purposes. **NOT FINANCIAL ADVICE.**</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                  <div className="flex items-start">
                    <ShieldAlert className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                    <p className="text-sm text-destructive-foreground">
                      <strong>Disclaimer:</strong> The information provided is for educational and conceptual purposes only and does not constitute financial advice. Trading involves substantial risk of loss. Always do your own research and consult with a qualified financial advisor before making any trading decisions.
                    </p>
                  </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  {analysisResult.suggestedActionDirection === "Buy" ? <TrendingUp className="h-4 w-4 text-green-500"/> : 
                   analysisResult.suggestedActionDirection === "Sell" ? <TrendingDown className="h-4 w-4 text-red-500"/> :
                   <CircleDot className="h-4 w-4 text-yellow-500"/> 
                  }
                  Suggested Conceptual Direction
                </Label>
                <p className="text-lg font-semibold">{analysisResult.suggestedActionDirection}</p>
              </div>
              
              {analysisResult.potentialEntryZone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Target className="h-4 w-4"/>Conceptual Entry Zone</Label>
                  <p className="text-sm mt-1 p-2 bg-muted/50 rounded-md">{analysisResult.potentialEntryZone}</p>
                </div>
              )}
              
              <div className="grid sm:grid-cols-2 gap-4">
                {analysisResult.potentialTakeProfitZone && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Target className="h-4 w-4 text-green-500"/>Conceptual Take Profit Zone</Label>
                    <p className="text-sm mt-1 p-2 bg-muted/50 rounded-md">{analysisResult.potentialTakeProfitZone}</p>
                  </div>
                )}
                {analysisResult.potentialStopLossLevel && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><StopCircle className="h-4 w-4 text-red-500"/>Conceptual Stop Loss Level</Label>
                    <p className="text-sm mt-1 p-2 bg-muted/50 rounded-md">{analysisResult.potentialStopLossLevel}</p>
                  </div>
                )}
              </div>

              {analysisResult.conceptualTimeframe && (
                 <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><CalendarClock className="h-4 w-4"/>Conceptual Timeframe</Label>
                  <p className="text-sm mt-1 p-2 bg-muted/50 rounded-md">{analysisResult.conceptualTimeframe}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Info className="h-4 w-4"/>Simplified Reasoning</Label>
                <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md whitespace-pre-wrap">{analysisResult.reasoningForNonICTUser}</p>
              </div>
            </CardContent>
          </Card>

          {/* ICT-Specific Analysis Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2"><Brain className="text-primary"/>ICT-Specific Conceptual Analysis</CardTitle>
              <CardDescription>Detailed conceptual insights for those familiar with ICT methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Potential Bias</Label>
                <p className="text-lg font-semibold">{analysisResult.potentialBias} (Confidence: {analysisResult.confidence})</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Key Observations (ICT)</Label>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  {analysisResult.keyObservations.map((obs, index) => (
                    <li key={index} className="text-sm">{obs}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Suggested Focus (ICT)</Label>
                <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md whitespace-pre-wrap">{analysisResult.suggestedFocusICT}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

